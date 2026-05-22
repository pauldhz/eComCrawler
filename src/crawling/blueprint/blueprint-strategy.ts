import { CheerioCrawler, PlaywrightCrawler } from "crawlee";
import { CrawlingStrategy } from "../crawling-strategy.js";
import { createCrawlerFromBlueprint } from './../../crawling/blueprint/blueprint-runner.js';


export class BlueprintStrategy implements CrawlingStrategy {

    createCrawler(data: any): {
        crawler: CheerioCrawler | PlaywrightCrawler,
        startUrls: { url: string; label: string }[];
    } 
    { 
        return createCrawlerFromBlueprint(data);
    }
    
} 