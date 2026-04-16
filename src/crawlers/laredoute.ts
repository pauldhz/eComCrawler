import { PlaywrightCrawler, createPlaywrightRouter, Dataset, BrowserName, OperatingSystemsName, DeviceCategory } from "crawlee";
import { firefox } from 'playwright';
import { launchOptions } from 'camoufox-js';

export const router = createPlaywrightRouter();

// Niveau 1 : Homepage → on cherche les liens de catégories
router.addHandler('HOME', async ({ page, enqueueLinks, log }) => {
    log.info('Crawling homepage...');
    await page.waitForLoadState('networkidle');

    await enqueueLinks({
        globs: ['https://www.laredoute.fr/pplp/100/**'],
        label: 'CATEGORY',
    });
});

// Niveau 2 : Page catégorie → on cherche les liens produits
router.addHandler('CATEGORY', async ({ page, enqueueLinks, log, request }) => {
    log.info(`Crawling category: ${request.url}`);
    await page.waitForLoadState('networkidle');

    await enqueueLinks({
        globs: ['https://www.laredoute.fr/ppdp/**'],
        label: 'PRODUCT',
    });
});

// Niveau 3 : Page produit → on scrape
router.addHandler('PRODUCT', async ({ page, request, log }) => {
    log.info(`Crawling product: ${request.url}`);
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    const price = await page.$eval('.price', (el: Element) => el.textContent?.trim()).catch(() => null);

    await Dataset.pushData({ url: request.url, title, price });
});

export const laredouteCrawler = new PlaywrightCrawler({
    postNavigationHooks: [
        async ({ handleCloudflareChallenge }) => {
            await handleCloudflareChallenge();
        },
    ],
    browserPoolOptions: {
        useFingerprints: false,
    },
    launchContext: {
        launcher: firefox,
        launchOptions: await launchOptions({
            headless: false,
        }),
    },
});

// Départ : la homepage avec le label HOME
export const laredouteStartUrl = [
    { url: 'https://www.laredoute.fr/', label: 'HOME' },
];