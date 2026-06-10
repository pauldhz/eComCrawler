import { Dataset } from 'crawlee';

import { CrawlingStrategyFactory, CrawlingStrategyType } from './crawling/crawling-strategy.js';

// const { crawler, startUrls } = CrawlingStrategyFactory.of(CrawlingStrategyType.BLUEPRINT_STRATEGY).createCrawler('data/blueprints/mdm.json');
const { crawler, startUrls } = await CrawlingStrategyFactory.of(CrawlingStrategyType.MANUAL_STRATEGY).createCrawler('data/blueprints/mdm.json');
await crawler.run(startUrls);

await Dataset.exportToJSON('OUTPUT');
