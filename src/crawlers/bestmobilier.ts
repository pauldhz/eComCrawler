import { PlaywrightCrawler, Dataset, createPlaywrightRouter } from 'crawlee';

export const router = createPlaywrightRouter();

router.addHandler('CATEGORY', async ({ page, request, enqueueLinks, log }) => {
    log.info(`Crawling category: ${request.url}`);
    await page.waitForLoadState('networkidle');
    await enqueueLinks({
        globs: ['https://bestmobilier.com/*-p[0-9]*'],
        label: 'PRODUCT',
    });
});

router.addHandler('PRODUCT', async ({ page, request, log }) => {
    log.info(`Crawling product: ${request.url}`);
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    const price = await page.$eval('.price', (el: Element) => el.textContent?.trim()).catch(() => null);

    await Dataset.pushData({ url: request.url, title, price });
});

export const bestmobilierCrawler = new PlaywrightCrawler({
    maxConcurrency: 3,
    headless: false,
    requestHandler: router,
    failedRequestHandler({ request, log }) {
        log.error(`Failed: ${request.url}`);
    },
});

export const bestmobilierStartUrls = [
    { url: 'https://bestmobilier.com/canape-c7', label: 'CATEGORY' },
];
