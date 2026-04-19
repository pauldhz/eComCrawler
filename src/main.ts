import { Dataset } from 'crawlee';
import { createCrawlerFromBlueprint } from './blueprint/blueprint-runner.js';

// ── Blueprint runner ──────────────────────────────────────────────────────────
// const { crawler, startUrls } = createCrawlerFromBlueprint('data/blueprints/terria.json');
const { crawler, startUrls } = createCrawlerFromBlueprint('data/blueprints/mdm.json');
await crawler.run(startUrls);

const dataset = await Dataset.open();
await dataset.exportToCSV('mdm-export');
