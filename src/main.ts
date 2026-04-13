import { PlaywrightCrawler, Dataset } from 'crawlee';

const crawler = new PlaywrightCrawler({
    maxConcurrency: 3,

    async requestHandler({ page, request, enqueueLinks, log }) {
        log.info(`Crawling: ${request.url}`);

        await page.waitForLoadState('networkidle');

        const title = await page.title();
        const price = await page.$eval('.price', el => el.textContent?.trim()).catch(() => null);

        await Dataset.pushData({
            url: request.url,
            title,
            price,
        });

        await enqueueLinks({
            globs: ['https://bestmobilier.com/produit/**'],
        });
    },

    failedRequestHandler({ request, log }) {
        log.error(`Failed: ${request.url}`);
    },
});

await crawler.run(['https://bestmobilier.com/']);