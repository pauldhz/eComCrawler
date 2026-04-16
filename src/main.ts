import { Dataset } from 'crawlee';
import { bestmobilierCrawler, bestmobilierStartUrls } from './crawlers/bestmobilier.js';
import { laredouteCrawler, laredouteStartUrl } from './crawlers/laredoute.js';
import {terriaCrawler, terriaStartUrls } from './crawlers/terria.js';

// await laredouteCrawler.run(laredouteStartUrl);
// await bestmobilierCrawler.run(bestmobilierStartUrls);
await terriaCrawler.run(terriaStartUrls);
const dataset = await Dataset.open();
await dataset.exportToCSV('terria-export');  // crée storage/key_value_stores/defau