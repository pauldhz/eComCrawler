import { CheerioCrawler, createCheerioRouter, PlaywrightCrawler, createPlaywrightRouter, Dataset, CheerioCrawlingContext, CrawlingContext } from 'crawlee';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Blueprint, FieldDef, LevelDef } from './blueprint-model.js';
import { extractAttr, extractAttrList, extractKeyValueTable, extractText, extractTextFilter, extractTextGroupList } from './blueprint-extractors.js';
import { CheerioAdapter, PlaywrightAdapter, ExtractionAdapter } from './blueprint-adapter.js';
import { posthook, prehook } from '../configuration/hooks.js';

// ─── Extraction ───────────────────────────────────────────────────────────────

/** Dispatche vers la méthode d'extraction adaptée selon `field.type`. */
async function extractField(adapter: ExtractionAdapter, field: FieldDef): Promise<unknown> {
    switch (field.type) {
        case 'text':            return extractText(adapter, field);
        case 'text-filter':     return extractTextFilter(adapter, field);
        case 'attr':            return extractAttr(adapter, field);
        case 'attr-list':       return extractAttrList(adapter, field);
        case 'key-value-table': return extractKeyValueTable(adapter, field);
        case 'text-group-list': return extractTextGroupList(adapter, field);
    }
}

/** Traite un niveau : navigation, pagination et/ou extraction de données. */
async function processLevel(
    adapter: ExtractionAdapter,
    level: LevelDef,
    context: { enqueueLinks: CheerioCrawlingContext['enqueueLinks']; addRequests: CheerioCrawlingContext['addRequests']; request: CheerioCrawlingContext['request']; log: CheerioCrawlingContext['log'] }
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
            if (field.flatten && typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(record, value);
            } else {
                record[field.key] = value;
            }
        }
        await Dataset.pushData(record);
    }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export const createCrawlerFromBlueprint = (blueprintPath: string): {
    crawler: CheerioCrawler | PlaywrightCrawler;
    startUrls: { url: string; label: string }[];
} => {
    const blueprint: Blueprint = JSON.parse(
        readFileSync(resolve(blueprintPath), 'utf-8')
    );

    let startUrls: { url: string; label: string }[] = [];
    for (const level of blueprint.levels) {
        if (level.startUrls) startUrls = level.startUrls;
    }

    const debug = blueprint.site.debug ?? false;

    if (blueprint.site.engine === 'playwright') {
        const router = createPlaywrightRouter();
        for (const level of blueprint.levels) {
            router.addHandler(level.label, async (ctx) => {
                const adapter = new PlaywrightAdapter(ctx.page);
                await processLevel(adapter, level, ctx);
            });
        }
        return {
            crawler: new PlaywrightCrawler({
                requestHandler: router,
                headless: false,
                ...(debug && {
                    preNavigationHooks: [async ({ request, log }) => {
                        log.debug(`→ [${request.label ?? '?'}] ${request.url}`);
                    }],
                }),
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
            requestHandler: router,
            ...(debug && {
                preNavigationHooks: [async ({ request, log }) => prehook({ request, log } as CheerioCrawlingContext)],
                postNavigationHooks: [async ({ request, response, log }) => posthook({request, response, log } as CheerioCrawlingContext)],
            }),
        }),
        startUrls,
    };
}
