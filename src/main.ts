import { Dataset } from 'crawlee';

import { log } from 'crawlee';
import tls from 'tls';
import { CrawlingStrategyFactory, CrawlingStrategyType } from './crawling/crawling-strategy.js';

(tls as any).DEFAULT_MIN_VERSION = 'TLSv1.3';

log.setLevel(log.LEVELS.DEBUG);
const { crawler, startUrls } = CrawlingStrategyFactory.of(CrawlingStrategyType.BLUEPRINT_STRATEGY).createCrawler('data/blueprints/mdm.json');
await crawler.run(startUrls);

const dataset = await Dataset.open();
// await dataset.exportToCSV('mdm-export');
