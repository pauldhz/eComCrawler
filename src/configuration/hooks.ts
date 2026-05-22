import { CrawlingContext } from 'crawlee';
import type { Response as PlaywrightResponse } from 'playwright';

export const prehook = (context: CrawlingContext) => {
    const { request, log } = context;
};

export const posthook = async (context: CrawlingContext) => {
    const { request, response, log } = context;

    // Playwright : response est un objet Playwright Response
    if (response && typeof (response as PlaywrightResponse).request === 'function') {
        const playwrightRes = response as PlaywrightResponse;
        const sentHeaders = await playwrightRes.request().allHeaders();
        log.debug(`← [${playwrightRes.status()}] ${request.url}`);
        log.debug(`  Sent headers post: ${JSON.stringify(sentHeaders, null, 2)}`);
        return;
    }

    // else, Cheerio
    const res = response as
        | {
              statusCode?: number;
              headers?: Record<string, string>;
              request?: { options?: { headers?: Record<string, string> } };
          }
        | undefined;
    const status = res?.statusCode ?? '?';
    const ct = (res?.headers?.['content-type'] ?? '').split(';')[0];
    const size = res?.headers?.['content-length'] ?? '?';
    log.debug(`← [${status}] ${request.url}  (${ct}, ${size}b)`);
    // Headers réellement envoyés (injectés par got-scraping)
    const sentHeaders = res?.request?.options?.headers;
    if (sentHeaders) {
        log.debug(`  Sent headers: ${JSON.stringify(sentHeaders, null, 2)}`);
    }
};
