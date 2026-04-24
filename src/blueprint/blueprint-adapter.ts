import { CheerioCrawlingContext } from '@crawlee/cheerio';
import type { Page } from 'playwright';

/**
 * Interface commune d'extraction indépendante du moteur de crawling.
 * Implémentée par `CheerioAdapter` (HTML statique) et `PlaywrightAdapter` (browser réel).
 */
export interface ExtractionAdapter {
    /** Texte du premier élément correspondant au sélecteur. */
    getText(selector: string): Promise<string>;

    /** Texte du premier élément dont le contenu contient `filter`. */
    getTextFiltered(selector: string, filter: string): Promise<string>;

    /** Valeur d'un attribut HTML sur le premier élément trouvé. */
    getAttr(selector: string, attr: string): Promise<string | null>;

    /** Collecte un attribut sur tous les éléments correspondants. */
    getAttrList(selector: string, attr: string): Promise<string[]>;

    /** Texte de tous les éléments correspondants (filtrés non-vides). */
    getTextList(selector: string): Promise<string[]>;

    /** Lit un tableau HTML à deux colonnes et retourne un objet clé/valeur. */
    getKeyValueTable(
        selector: string,
        keyCell: string,
        valueCell: string
    ): Promise<Record<string, string>>;

    /** URL de la page suivante via un attribut sur un élément de pagination. */
    getNextPageUrl(selector: string, attr: string): Promise<string | null>;
}

// ─── Implémentation Cheerio ───────────────────────────────────────────────────

export class CheerioAdapter implements ExtractionAdapter {
    constructor(private $: CheerioCrawlingContext['$']) {}

    async getText(selector: string): Promise<string> {
        return this.$(selector).first().text();
    }

    async getTextFiltered(selector: string, filter: string): Promise<string> {
        return this.$(selector)
            .filter((_, el) => this.$(el).text().includes(filter))
            .text();
    }

    async getAttr(selector: string, attr: string): Promise<string | null> {
        return this.$(selector).first().attr(attr) ?? null;
    }

    async getAttrList(selector: string, attr: string): Promise<string[]> {
        const values: string[] = [];
        this.$(selector).each((_, el) => {
            const val = this.$(el).attr(attr);
            if (val) values.push(val);
        });
        return values;
    }

    async getTextList(selector: string): Promise<string[]> {
        const texts: string[] = [];
        this.$(selector).each((_, el) => {
            const text = this.$(el).text().trim();
            if (text) texts.push(text);
        });
        return texts;
    }

    async getKeyValueTable(
        selector: string,
        keyCell: string,
        valueCell: string
    ): Promise<Record<string, string>> {
        const specs: Record<string, string> = {};
        this.$(selector).each((_, row) => {
            const key = this.$(row).find(keyCell).text().trim();
            const value = this.$(row).find(valueCell).text().trim();
            if (key) specs[key] = value;
        });
        return specs;
    }

    async getNextPageUrl(selector: string, attr: string): Promise<string | null> {
        return this.$(selector).attr(attr) ?? null;
    }
}

// ─── Implémentation Playwright ────────────────────────────────────────────────

export class PlaywrightAdapter implements ExtractionAdapter {
    constructor(private page: Page) {}

    async getText(selector: string): Promise<string> {
        try {
            return (await this.page.locator(selector).first().textContent()) ?? '';
        } catch {
            return '';
        }
    }

    async getTextFiltered(selector: string, filter: string): Promise<string> {
        const elements = await this.page.$$(selector);
        for (const el of elements) {
            const text = (await el.textContent()) ?? '';
            if (text.includes(filter)) return text;
        }
        return '';
    }

    async getAttr(selector: string, attr: string): Promise<string | null> {
        try {
            return await this.page.locator(selector).first().getAttribute(attr);
        } catch {
            return null;
        }
    }

    async getAttrList(selector: string, attr: string): Promise<string[]> {
        const elements = await this.page.$$(selector);
        const values: string[] = [];
        for (const el of elements) {
            const val = await el.getAttribute(attr);
            if (val) values.push(val);
        }
        return values;
    }

    async getTextList(selector: string): Promise<string[]> {
        const elements = await this.page.$$(selector);
        const texts: string[] = [];
        for (const el of elements) {
            const text = (await el.textContent())?.trim() ?? '';
            if (text) texts.push(text);
        }
        return texts;
    }

    async getKeyValueTable(
        selector: string,
        keyCell: string,
        valueCell: string
    ): Promise<Record<string, string>> {
        const rows = await this.page.$$(selector);
        const specs: Record<string, string> = {};
        for (const row of rows) {
            const keyEl = await row.$(keyCell);
            const valueEl = await row.$(valueCell);
            const key = (await keyEl?.textContent())?.trim() ?? '';
            const value = (await valueEl?.textContent())?.trim() ?? '';
            if (key) specs[key] = value;
        }
        return specs;
    }

    async getNextPageUrl(selector: string, attr: string): Promise<string | null> {
        try {
            return await this.page.locator(selector).first().getAttribute(attr);
        } catch {
            return null;
        }
    }
}
