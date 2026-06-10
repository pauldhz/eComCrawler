import { Log } from "crawlee";
import { Handler } from "../../../../../shared/pattern/chainofresponsibility/handler.js";
import { Page } from "playwright";
import { DescriptionParser } from "../description-parser.js";
import { Dimensions } from "../../../../../domain/scrapping.js";
import { MEASUREMENTS } from "../../../../../domain/measurement.js";

export class CommonDescriptionHandler extends Handler<Page, {page: Page, log: Log, callback: (dimensions: Dimensions, matters: string) => void}> {
    
    protected async canHandle(page: Page): Promise<boolean> {
        return await page.locator('#mainProductDescription dscpdp').count() > 0;
    }

    protected async process(execution: { page: Page; log: Log; callback: (dimensions: Dimensions, matters: string) => void }): Promise<void> {
        const { page, log, callback } = execution;
        const description = await page.locator('#mainProductDescription dscpdp').innerHTML();
                const resultForDimensions = description
                    ?.split('<br')
                    .map(line => line.replace(/(&nbsp;|•|<\/?b>)/g, '').replace(/<|>/g, '').trim());
        
                const resultForMatter = description
                    ?.split('<br>')
                    .map(line => line.replace(/(&nbsp;|•)/g, '').trim());
                
                const filteredResultForDimensions = DescriptionParser.getNeighbors(resultForDimensions, MEASUREMENTS, 1, 4);
                const filteredResultForMatter = DescriptionParser.getNeighbors(resultForMatter, ['Description'], 0, -1, line => line.includes('<b>'));
        
                const dimensions = DescriptionParser.parseMeasurementsWithDynamicKey(filteredResultForDimensions);
                const matters = filteredResultForMatter.slice(1).join(' - ');
                callback(dimensions, matters);
    }
}