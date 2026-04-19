import { Dataset } from 'crawlee';
import { createCrawlerFromBlueprint } from './blueprint/blueprint-runner.js';
import { log } from 'crawlee';

log.setLevel(log.LEVELS.DEBUG);
// ── Blueprint runner ──────────────────────────────────────────────────────────
const { crawler, startUrls } = createCrawlerFromBlueprint('data/blueprints/terria.json');
// const { crawler, startUrls } = createCrawlerFromBlueprint('data/blueprints/mdm.json');
await crawler.run(startUrls);

const dataset = await Dataset.open();
await dataset.exportToCSV('terria-export');
