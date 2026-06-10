import { Page } from "playwright";
import { Handler } from "../../../../../shared/pattern/chainofresponsibility/handler.js";
import { Log } from "crawlee";
import { Dimensions } from "../../../../../domain/scrapping.js";

export class CommonDescriptionHandler extends Handler<Page, {selector: string, page: Page, url: string, log: Log, callback: (dimensions: Dimensions, matters: string) => void}> {

    protected async canHandle(page: Page): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    protected async process(execution: { page: Page; url: string; log: Log; callback: (dimensions: Dimensions, matters: string) => void }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}