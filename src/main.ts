import { Dataset } from 'crawlee';
import { createCrawlerFromBlueprint } from './blueprint/blueprint-runner.js';
import { log } from 'crawlee';
import tls from 'tls';

(tls as any).DEFAULT_MIN_VERSION = 'TLSv1.3';

log.setLevel(log.LEVELS.DEBUG);
// ── Blueprint runner ──────────────────────────────────────────────────────────
// const { crawler, startUrls } = createCrawlerFromBlueprint('data/blueprints/terria.json');
const { crawler, startUrls } = createCrawlerFromBlueprint('data/blueprints/mdm.json');
// const { crawler, startUrls } = createCrawlerFromBlueprint('data/blueprints/test/httpbin.json');
await crawler.run(startUrls);

const dataset = await Dataset.open();
// await dataset.exportToCSV('mdm-export');
