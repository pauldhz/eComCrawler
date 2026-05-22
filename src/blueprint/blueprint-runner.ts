import {
    CheerioCrawler,
    createCheerioRouter,
    PlaywrightCrawler,
    createPlaywrightRouter,
    Dataset,
    CheerioCrawlingContext,
    ProxyConfiguration,
    PlaywrightCrawlingContext,
} from 'crawlee';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { Blueprint, FieldDef, LevelDef } from './blueprint-model.js';
import {
    extractAttr,
    extractAttrList,
    extractKeyValueTable,
    extractText,
    extractTextFilter,
    extractTextGroupList,
} from './blueprint-extractors.js';
import { CheerioAdapter, PlaywrightAdapter, ExtractionAdapter } from './blueprint-adapter.js';
import { posthook, prehook } from '../configuration/hooks.js';
import { Camoufox } from 'camoufox-js';
import { BrowserName } from '@crawlee/browser-pool';

loadEnv();

function resolveEnvVars(urls: string[]): string[] {
    return urls.map((url) => {
        if (!url.startsWith('$')) return url;
        const varName = url.slice(1);
        const value = process.env[varName];
        if (!value)
            throw new Error(
                `Variable d'environnement manquante : ${varName} (référencée dans le blueprint)`
            );
        return value;
    });
}

// ─── Extraction ───────────────────────────────────────────────────────────────

/** Dispatche vers la méthode d'extraction adaptée selon `field.type`. */
async function extractField(adapter: ExtractionAdapter, field: FieldDef): Promise<unknown> {
    switch (field.type) {
        case 'text':
            return extractText(adapter, field);
        case 'text-filter':
            return extractTextFilter(adapter, field);
        case 'attr':
            return extractAttr(adapter, field);
        case 'attr-list':
            return extractAttrList(adapter, field);
        case 'key-value-table':
            return extractKeyValueTable(adapter, field);
        case 'text-group-list':
            return extractTextGroupList(adapter, field);
    }
}

/** Traite un niveau : navigation, pagination et/ou extraction de données. */
async function processLevel(
    adapter: ExtractionAdapter,
    level: LevelDef,
    context: {
        enqueueLinks: CheerioCrawlingContext['enqueueLinks'];
        addRequests: CheerioCrawlingContext['addRequests'];
        request: CheerioCrawlingContext['request'];
        log: CheerioCrawlingContext['log'];
    }
): Promise<void> {
    const { enqueueLinks, addRequests, request, log } = context;
    log.info(`[${level.label}] ${request.url}`);

    if (level.enqueueLinks) {
        await enqueueLinks({ globs: level.enqueueLinks.globs, label: level.enqueueLinks.label });
    }

    if (level.pagination) {
        const attr = level.pagination.attr ?? 'href';
        const nextUrl = await adapter.getNextPageUrl(level.pagination.nextSelector, attr);
        if (nextUrl) {
            log.info(`[${level.label}] Next page → ${nextUrl}`);
            await addRequests([{ url: nextUrl, label: level.label }]);
        }
    }

    if (level.fields) {
        const record: Record<string, unknown> = { url: request.url };
        for (const field of level.fields) {
            const value = await extractField(adapter, field);
            if (
                field.flatten &&
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)
            ) {
                Object.assign(record, value);
            } else {
                record[field.key] = value;
            }
        }
        await Dataset.pushData(record);
    }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export const createCrawlerFromBlueprint = (
    blueprintPath: string
): {
    crawler: CheerioCrawler | PlaywrightCrawler;
    startUrls: { url: string; label: string }[];
} => {
    const blueprint: Blueprint = JSON.parse(readFileSync(resolve(blueprintPath), 'utf-8'));

    let startUrls: { url: string; label: string }[] = [];
    for (const level of blueprint.levels) {
        if (level.startUrls) startUrls = level.startUrls;
    }

    const debug = blueprint.site.debug ?? false;

    const userAgentHeaders: Record<string, string> = blueprint.site.userAgent
        ? JSON.parse(readFileSync(resolve(blueprint.site.userAgent), 'utf-8'))
        : {};

    const proxyConfiguration = blueprint.site.proxy
        ? new ProxyConfiguration({ proxyUrls: resolveEnvVars(blueprint.site.proxy.urls) })
        : undefined;

    if (blueprint.site.engine === 'camoufox' || blueprint.site.engine === 'playwright') {
        const isCamoufox = blueprint.site.engine === 'camoufox';
        const router = createPlaywrightRouter();
        for (const level of blueprint.levels) {
            router.addHandler(level.label, async (ctx) => {
                const adapter = new PlaywrightAdapter(ctx.page);
                await processLevel(adapter, level, ctx);
            });
        }
        const camoufoxLauncher = {
            name: () => 'firefox',
            launch: async () => Camoufox({ headless: false, humanize: true }),
        };

        // Cookies partagés entre les contextes incognito successifs
        const sharedCookies: { name: string; value: string; domain?: string; path?: string; expires?: number; httpOnly?: boolean; secure?: boolean; sameSite?: 'Strict' | 'Lax' | 'None' }[] = [];

        return {
            crawler: new PlaywrightCrawler({
                ...(isCamoufox && {
                    launchContext: {
                        launcher: camoufoxLauncher as any,
                        useIncognitoPages: true, // Camoufox ne supporte pas launchPersistentContext
                    },
                }),
                ...(!isCamoufox && {
                    browserPoolOptions: {
                        useFingerprints: true,
                        fingerprintOptions: {
                            fingerprintGeneratorOptions: {
                                browsers: [{ name: BrowserName.chrome, minVersion: 130 }],
                                devices: ['desktop'] as any,
                                operatingSystems: ['windows', 'macos'] as any,
                                locales: ['fr-FR', 'en-US'],
                            },
                        },
                    },
                }),
                maxConcurrency: 1,
                minConcurrency: 1,
                maxRequestsPerMinute: 20,
                requestHandler: router,
                proxyConfiguration,
                preNavigationHooks: [
                    async ({ page, request, log }) => {
                        // Injecter les cookies collectés sur les pages précédentes
                        if (sharedCookies.length > 0) {
                            await page.context().addCookies(sharedCookies);
                        }
                        // Corriger sec-fetch-site et referer pour les navigations internes
                        if (request.label !== 'HOME') {
                            await page.route('**', async (route) => {
                                const req = route.request();
                                if (req.isNavigationRequest()) {
                                    const headers = await req.allHeaders();
                                    await route.continue({
                                        headers: {
                                            ...headers,
                                            'sec-fetch-site': 'same-origin',
                                            referer: blueprint.site.baseUrl,
                                        },
                                    });
                                } else {
                                    await route.continue();
                                }
                            });
                        }
                        if (debug) prehook({ request, log } as PlaywrightCrawlingContext);
                    },
                ],
                postNavigationHooks: [
                    async ({ page, request, response, log }) => {
                        // Collecter les cookies (dont datadome) pour les prochains contextes
                        const cookies = await page.context().cookies();
                        for (const cookie of cookies) {
                            const idx = sharedCookies.findIndex(
                                (c: { name: string; domain?: string }) => c.name === cookie.name && c.domain === cookie.domain,
                            );
                            if (idx >= 0) sharedCookies[idx] = cookie;
                            else sharedCookies.push(cookie);
                        }
                        if (debug) posthook({ request, response, log } as PlaywrightCrawlingContext);
                    },
                ],
            }),
            startUrls,
        };
    }

    // engine === 'cheerio' (défaut)
    const router = createCheerioRouter();
    for (const level of blueprint.levels) {
        router.addHandler(level.label, async (ctx) => {
            const adapter = new CheerioAdapter(ctx.$);
            await processLevel(adapter, level, ctx);
        });
    }
    return {
        crawler: new CheerioCrawler({
            errorHandler: async ({ request, error, log }) => {
                log.error(`Erreur navigation [${request.label}]}`);
            },
            maxConcurrency: 1,
            minConcurrency: 1,
            maxRequestsPerMinute: 20,
            requestHandler: router,
            proxyConfiguration,

            preNavigationHooks: [
                async ({ request, log }, gotOptions) => {
                    // if (Object.keys(userAgentHeaders).length > 0) {
                    log.warning(JSON.stringify(gotOptions.headers));
                    // }
                    if (debug) prehook({ request, log } as CheerioCrawlingContext);
                },
            ],
            ...(debug && {
                postNavigationHooks: [
                    ({ request, response, log }) =>
                        posthook({ request, response, log } as CheerioCrawlingContext),
                ],
            }),
        }),
        startUrls,
    };
};
