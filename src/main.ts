import { CheerioCrawler } from 'crawlee';

const crawler = new CheerioCrawler({
    async requestHandler({ $, request }) {
        const title = $('title').text();
        console.log(`[${request.url}] Title: ${title}`);
    },
});

await crawler.run(['https://example.com']);