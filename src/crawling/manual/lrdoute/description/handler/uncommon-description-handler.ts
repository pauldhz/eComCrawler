import { Page } from "playwright";
import { Handler } from "../../../../../shared/pattern/chainofresponsibility/handler.js";
import { Log } from "crawlee";
import { Dimensions } from "../../../../../domain/scrapping.js";
import { DescriptionParser } from "../description-parser.js";
import { MEASUREMENTS } from "../../../../../domain/measurement.js";
import { MATTER_LABELS } from "../../../../../domain/jargon/matter.js";

export class UncommonDescriptionHandler extends Handler<Page, { selector: string, page: Page, url: string, log: Log, callback: (dimensions: Dimensions, matters: string) => void }> {

    protected async canHandle(page: Page): Promise<boolean> {
        return await page.locator('#mainProductDescription').count() > 0;
    }

    protected async process(execution: { page: Page; log: Log; callback: (pMeasurements: Dimensions, pMatters: string) => void }): Promise<void> {
        const { page, log, callback } = execution;
        const description = await page.locator('#mainProductDescription');
        const list = await description.locator('li');
        const measurements = (await list.allTextContents()).filter(elem => MEASUREMENTS.some(measure => elem.includes(measure)));
        const matters = (await list.allTextContents()).filter(elem => MATTER_LABELS.some(label => elem.includes(label))).map(item => item.split(':').slice(1).join(':').trim()).join(" - ");
        
        const measurementParsed = DescriptionParser.parseMeasurements(measurements);

        callback(measurementParsed, matters);
    }

}