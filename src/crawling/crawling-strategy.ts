import { CheerioCrawler, PlaywrightCrawler } from "crawlee";
import { BlueprintStrategy } from "./blueprint/blueprint-strategy.js";
import { ManualStrategy } from "./manual/lrdoute/manual-strategy.js";



export enum CrawlingStrategyType{
    BLUEPRINT_STRATEGY, MANUAL_STRATEGY
}

export class CrawlingStrategyFactory {
    static of(strategy: CrawlingStrategyType): CrawlingStrategy {
        switch(strategy) {
            case CrawlingStrategyType.BLUEPRINT_STRATEGY: return new BlueprintStrategy();
            case CrawlingStrategyType.MANUAL_STRATEGY: return new ManualStrategy();
        }
    }
}

export interface CrawlingStrategy {
    createCrawler(data: any): Promise<{
        crawler: CheerioCrawler | PlaywrightCrawler,
        startUrls: { url: string; label: string }[];
    }>;
}