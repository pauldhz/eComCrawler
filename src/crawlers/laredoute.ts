import { PlaywrightCrawler, createPlaywrightRouter, Dataset, BrowserName, DeviceCategory, OperatingSystemsName } from "crawlee";
import type { Page } from "playwright";

export const router = createPlaywrightRouter();

router.addHandler('CATEGORY', async ({ page, request, enqueueLinks, log}) => {
    log.info(`Crawling category: ${request.url}`);
    await page.waitForLoadState('networkidle');
    await enqueueLinks({
        globs: ['https://www.laredoute.fr/'],
        label: 'PRODUCT',
    });
});

router.addHandler('PRODUCT', async({page, request, log}) => {
    log.info(`Crawling product: ${request.url}`);
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    const price = await page.$eval('.price', (el: Element) => el.textContent?.trim()).catch(() => null);

    await Dataset.pushData({ url: request.url, title, price });
});

export const laredouteCrawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    headless: false,
    requestHandler: router,
    // Fingerprint réaliste pour éviter la détection Cloudflare
    browserPoolOptions: {
        useFingerprints: true,
        fingerprintOptions: {
            fingerprintGeneratorOptions: {
                browsers: [
                    {
                        name: BrowserName.edge,
                        minVersion: 96,
                    },
                ],
                devices: [DeviceCategory.desktop],
                operatingSystems: [OperatingSystemsName.windows],
                locales: ['fr-FR'],
            },
        },
    },
    
    failedRequestHandler({ request, log }) {
        log.error(`Failed: ${request.url}`);
    },
});

export const laredouteStartUrl = [
    { url: 'https://www.laredoute.fr/', label: 'CATEGORY' },
];