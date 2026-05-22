import { CheerioCrawler, PlaywrightCrawler } from "crawlee";
import { CrawlingStrategy } from "../crawling-strategy.js";

export class ManualStrategy implements CrawlingStrategy {

    createCrawler(data: any):{
        crawler: CheerioCrawler | PlaywrightCrawler,
        startUrls: { url: string; label: string }[];
    } {
        throw new Error("Method not implemented.");
    }
    
}