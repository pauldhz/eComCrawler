import { bestmobilierCrawler, bestmobilierStartUrls } from './crawlers/bestmobilier.js';
import { laredouteCrawler, laredouteStartUrl } from './crawlers/laredoute.js';

await laredouteCrawler.run(laredouteStartUrl);
// await bestmobilierCrawler.run(bestmobilierStartUrls);