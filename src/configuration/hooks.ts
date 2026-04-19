import { CrawlingContext } from "crawlee";

export const prehook = (context: CrawlingContext) => {
    const { request, log } = context;
    log.debug(`→ [${request.label ?? '?'}] ${request.url}`);
    // request.headers ne contient que les headers custom explicites
    if (Object.keys(request.headers ?? {}).length > 0) {
        log.debug(`  Custom headers: ${JSON.stringify(request.headers, null, 2)}`);
    }
};

export const posthook = (context: CrawlingContext) => {
    const { request, response, log } = context;
    const res = response as { statusCode?: number; headers?: Record<string, string>; request?: { options?: { headers?: Record<string, string> } } } | undefined;
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