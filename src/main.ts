import { Dataset } from 'crawlee';
import { createCrawlerFromBlueprint } from './blueprintRunner.js';

// ── Blueprint runner ──────────────────────────────────────────────────────────
const { crawler, startUrls } = createCrawlerFromBlueprint('src/blueprints/terria.json');
await crawler.run(startUrls);

const dataset = await Dataset.open();
await dataset.exportToCSV('terria-export');
