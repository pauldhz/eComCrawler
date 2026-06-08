import { CheerioCrawler, PlaywrightCrawler, RequestQueue } from "crawlee";
import { launchOptions } from 'camoufox-js';
import { CrawlingStrategy } from "../crawling-strategy.js";
import { firefox } from "playwright";
import { clickPositionCallback, isChallengeCallback } from "../../configuration/cloudflare-challenge.js";

export class ManualStrategy implements CrawlingStrategy {

    async createCrawler(data: any): Promise<{
        crawler: CheerioCrawler | PlaywrightCrawler,
        startUrls: { url: string; label: string }[];
    }> {
        const resolvedLaunchOptions = await launchOptions({ headless: false });

        const crawler = new PlaywrightCrawler({
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
            maxConcurrency: 1,
            async requestHandler({ request, page, log, enqueueLinks }) {
                const headerContent = await page.locator('title').textContent();
                log.info(`Title is ${headerContent}`);

                await enqueueLinks({
                    selector: '.unified-product-link',
                    label: 'PRODUCT',
                });
            }
        });

        return {
            crawler: crawler,
            startUrls: [{
                url: "https://www.laredoute.fr/pplp/100/75363/158092/cat-75503.aspx#shoppingtool=treestructureflyout",
                label: "tables basses"
            }]
        }
    }

}