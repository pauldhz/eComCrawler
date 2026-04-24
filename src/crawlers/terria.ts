import { CheerioCrawler, createCheerioRouter, Dataset } from 'crawlee';

export const router = createCheerioRouter();

router.addHandler('HOME', async ({ $, enqueueLinks }) => {
    const title = $('title').text();
    console.log(`For category - title is ${title}`);
    await enqueueLinks({
        globs: ['https://www.terria.fr/index.php?route=product/category**'],
        label: 'CATEGORY',
    });
});

router.addHandler('CATEGORY', async ({ $, enqueueLinks }) => {
    await enqueueLinks({
        globs: ['https://www.terria.fr/index.php?route=product/product**'],
        label: 'PRODUCT',
    });
});

router.addHandler('PRODUCT', async ({ $, request }) => {
    const url = request.url;
    const title = $('h1').first().text().trim();
    const price = $('h2').first().text().trim(); // ex: "665.00 € TTC"
    const reference = $('ul.list-unstyled li')
        .filter((_, el) => $(el).text().includes('Référence'))
        .text()
        .replace('Référence :', '')
        .trim();
    const availability = $('ul.list-unstyled li')
        .filter((_, el) => $(el).text().includes('Disponibilité'))
        .text()
        .replace('Disponibilité :', '')
        .trim();
    const ecoContribution = $('ul.list-unstyled li')
        .filter((_, el) => $(el).text().includes('dont'))
        .text()
        .trim();
    const shortDescription = $('#tab-description').text().trim();
    const longDescription = $('#tab-description1').text().trim();
    const productId = $('input[name="product_id"]').val();

    const specifications: Record<string, string> = {};
    $('#tab-specification tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        const key = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();
        if (key) specifications[key] = value;
    });

    const images: string[] = [];
    $('.thumbnails li a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) images.push(href);
    });

    await Dataset.pushData({
        url,
        productId,
        title,
        reference,
        price,
        ecoContribution,
        availability,
        shortDescription,
        longDescription,
        // Aplatissement des specs
        ...specifications, // "Structure": "Aluminium" devient une colonne directe
        // Images en colonnes séparées
        image1: images[0] ?? null,
        image2: images[1] ?? null,
        image3: images[2] ?? null,
    });
});

export const terriaCrawler = new CheerioCrawler({
    requestHandler: router,
});

export const terriaStartUrls = [{ url: 'https://www.terria.fr/', label: 'HOME' }];
