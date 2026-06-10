import { CheerioCrawler, Dataset, Log, PlaywrightCrawler } from "crawlee";
import { launchOptions } from 'camoufox-js';
import { CrawlingStrategy } from "../../crawling-strategy.js";
import { firefox, Locator, Page } from "playwright";
import { clickPositionCallback, isChallengeCallback } from "../../../configuration/cloudflare-challenge.js";
import { Dimensions, ScrappingModel, ScrappingModelBuilder } from "../../../domain/scrapping.js";
import { DescriptionParser } from "./description/description-parser.js";
import { CommonDescriptionHandler } from "./description/handler/common-description-handler.js";

export class ManualStrategy implements CrawlingStrategy {

    async createCrawler(data: any): Promise<{
        crawler: CheerioCrawler | PlaywrightCrawler,
        startUrls: { url: string; label: string }[];
    }> {
        const resolvedLaunchOptions = await launchOptions({ headless: true });

        const crawler = new PlaywrightCrawler({
            maxRequestsPerCrawl: 30,
            postNavigationHooks: [async ({ handleCloudflareChallenge }) => {
                await handleCloudflareChallenge({
                    isChallengeCallback,
                    clickPositionCallback,
                    preChallengeSleepSecs: 3,
                });
            }
            ],
            browserPoolOptions: {
                useFingerprints: false,
            },
            launchContext: {
                launcher: firefox,
                launchOptions: resolvedLaunchOptions,
            },
            maxConcurrency: 5,
            async requestHandler({ request, page, log, enqueueLinks }) {
                if (request.label === 'PRODUCT') {
                    const results = await ManualStrategy.extractProductData(page, request.url, log);
                    await Dataset.pushData(results);
                } else {
                    await enqueueLinks({
                        selector: '.unified-product-link',
                        label: 'PRODUCT',
                    });
                }
            }
        });

        return {
            crawler: crawler,
            startUrls: [
                {
                    url: "https://www.laredoute.fr/pplp/100/75363/158092/cat-75503.aspx?facets=vendor*000000000#shoppingtool=treestructureflyout",
                    label: "tables basses vendues par La Redoute"
                },
                // {
                //     url: "https://www.laredoute.fr/ppdp/prod-548627404.aspx#shoppingtool=treestructureflyout",
                //     label: "fiche produit de test"
                // }
            ]
        }
    }

    static async acceptCookiesIfVisible(page: Page, log: Log) {
        const button = page.locator('button:has-text("Tout accepter")');

        try {
            await button.click();
            log.info("Bouton d'acceptation des cookies cliqué.");
        } catch {
            // La popup n'est pas affichée, on continue.
        }
    }

    static async extractColors(page: Page, log: Log): Promise<string[]> {
        const dropdownColorArrow: Locator = page.locator('.main-product-container div[data-cerberus="dropdownColor"] .lr-arrow-right');
        const hasMultipleColors = await dropdownColorArrow.count() > 0;
        const colors: string[] = [];

        if (hasMultipleColors) {
            try {
                await dropdownColorArrow.click({ timeout: 3000 });
            } catch {
                await ManualStrategy.acceptCookiesIfVisible(page, log);
                await dropdownColorArrow.click();
            }
            const colorsElements = await page.$$('h3 ~ div[data-label] .color-selector > button.color-item');
            for (const colorElement of colorsElements) {
                const colorFilter = await colorElement.$('.pdp-filter-item-color span');
                const color = await colorFilter?.textContent();
                colors.push(color as string);
            }
        } else {
            const color = await page
                .locator('.pdp-infos div[data-cerberus="dropdownColor"] span[data-cerberus="pdp-colour-selected"]')
                .textContent();
            colors.push(color as string);
        }

        return colors;
    }

    static async extractDescription(page: Page, url: string, log: Log): Promise<{dimensions: Dimensions, matters: string}> {

        const commonHandler = new CommonDescriptionHandler();

        let dimensions: Dimensions = {} ;
        let matters = "";

        const callback = (cbDimensions: Dimensions, cbMatters: string) => {
            dimensions = cbDimensions;
            matters = cbMatters;
        }

        await commonHandler.handle(page, {page: page, log: log, callback: callback});

        return {dimensions: dimensions, matters: matters};
        
        // const description = await page.locator('#mainProductDescription dscpdp').innerHTML();
        // const resultForDimensions = description
        //     ?.split('<br')
        //     .map(line => line.replace(/(&nbsp;|•|<\/?b>)/g, '').replace(/<|>/g, '').trim());

        // const resultForMatter = description
        //     ?.split('<br>')
        //     .map(line => line.replace(/(&nbsp;|•)/g, '').trim());

        // const dimensionsNamings = ['Largeur', 'Hauteur', 'Profondeur', ' cm'];
        
        // const filteredResultForDimensions = DescriptionParser.getNeighbors(resultForDimensions, dimensionsNamings, 1, 4);
        // const filteredResultForMatter = DescriptionParser.getNeighbors(resultForMatter, ['Description'], 0, -1, line => line.includes('<b>'));

        // const dimensions = DescriptionParser.parseDimensions(filteredResultForDimensions);
        // const matters = filteredResultForMatter.slice(1).join(' - ');

        // return {dimensions: dimensions, matters: matters};
    }

    static async extractProductData(page: Page, url: string, log: Log): Promise<ScrappingModel> {
        log.info("Pour l'URL " + url);

        const title = await page.locator('title').textContent();
        const reference = await page.locator('div[data-label="Référence"]').textContent();
        const oldPrice = page.locator('.main-product-price--old');
        const mainPrice = await page.locator('.main-product-price').textContent();
        const hasSpecialOffer = await oldPrice.count() > 0;
        const price = hasSpecialOffer ? await oldPrice.textContent() : mainPrice;
        const specialOfferPrice = hasSpecialOffer ? mainPrice : null;

        const colors = await ManualStrategy.extractColors(page, log);

        const { dimensions, matters } = await this.extractDescription(page, url, log);

        return new ScrappingModelBuilder()
            .url(url)
            .title(title as string)
            .reference(reference as string)
            .price(price as string)
            .specialOfferPrice(specialOfferPrice as string)
            .dimensions(dimensions)
            .colors(colors)
            .matter(matters)
            .build();
    }
}