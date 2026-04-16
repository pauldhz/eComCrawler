import { CheerioCrawler, createCheerioRouter, Dataset, CheerioCrawlingContext } from 'crawlee';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Blueprint, FieldDef } from './blueprint-model.js';
import { extractAttr, extractAttrList, extractKeyValueTable, extractText, extractTextFilter } from './blueprint-extractors.js';

type $ = CheerioCrawlingContext['$'];

/** Dispatche vers la méthode d'extraction adaptée selon `field.type`. */
function extractField($: $, field: FieldDef): unknown {
    switch (field.type) {
        case 'text':            return extractText($, field);
        case 'text-filter':     return extractTextFilter($, field);
        case 'attr':            return extractAttr($, field);
        case 'attr-list':       return extractAttrList($, field);
        case 'key-value-table': return extractKeyValueTable($, field);
    }
}

// ─── Runner ──────────────────────────────────────────────────────────────────

export const createCrawlerFromBlueprint = (blueprintPath: string): {
    crawler: CheerioCrawler;
    startUrls: { url: string; label: string }[];
} => {
    const blueprint: Blueprint = JSON.parse(
        readFileSync(resolve(blueprintPath), 'utf-8')
    );

    const router = createCheerioRouter();
    let startUrls: { url: string; label: string }[] = [];

    for (const level of blueprint.levels) {
        if (level.startUrls) {
            startUrls = level.startUrls;
        }

        router.addHandler(level.label, async ({ $, enqueueLinks, request, log }) => {
            log.info(`[${level.label}] ${request.url}`);

            // Niveaux de navigation : on enqueue les liens suivants
            if (level.enqueueLinks) {
                await enqueueLinks({
                    globs: level.enqueueLinks.globs,
                    label: level.enqueueLinks.label,
                });
            }

            // Niveau produit : on extrait les données
            if (level.fields) {
                const record: Record<string, unknown> = { url: request.url };

                for (const field of level.fields) {
                    const value = extractField($, field);

                    // Aplatir les objets marqués flatten (attr-list, key-value-table)
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
        });
    }

    const crawler = new CheerioCrawler({ requestHandler: router });

    return { crawler, startUrls };
}
