import { FieldDef } from './blueprint-model.js';
import { ExtractionAdapter } from './blueprint-adapter.js';

/** Retourne le texte brut du premier élément correspondant au sélecteur. */
export const extractText = async (adapter: ExtractionAdapter, field: FieldDef): Promise<string> => {
    const text = await adapter.getText(field.selector);
    return field.transform === 'trim' ? text.trim() : text;
}

/** Filtre les éléments dont le texte contient `filter`, retire le préfixe `replace`. */
export const extractTextFilter = async (adapter: ExtractionAdapter, field: FieldDef): Promise<string> => {
    let text = await adapter.getTextFiltered(field.selector, field.filter ?? '');
    if (field.replace) text = text.replace(field.replace, '');
    return field.transform === 'trim' ? text.trim() : text;
}

/** Retourne la valeur d'un attribut HTML sur le premier élément trouvé. */
export const extractAttr = async (adapter: ExtractionAdapter, field: FieldDef): Promise<string | null> => {
    return adapter.getAttr(field.selector, field.attr ?? 'value');
}

/**
 * Collecte un attribut sur une liste d'éléments.
 * Si `flatten: true`, retourne un objet `{ image1, image2, ... }` au lieu d'un tableau.
 */
export const extractAttrList = async (adapter: ExtractionAdapter, field: FieldDef): Promise<string[] | Record<string, string | null>> => {
    const values = await adapter.getAttrList(field.selector, field.attr ?? 'href');

    if (!field.flatten) return values;

    const prefix = field.keyPrefix ?? field.key;
    const max = field.maxItems ?? values.length;
    const result: Record<string, string | null> = {};
    for (let i = 0; i < max; i++) {
        result[`${prefix}${i + 1}`] = values[i] ?? null;
    }
    return result;
}

/**
 * Collecte le texte de tous les éléments correspondants et découpe chacun par `groupBySeparator`.
 * Retourne un tableau d'objets `{ label, value }`.
 * Ex: ["Beige - Naturel", "Gris - Anthracite"] → [{ label: "Beige", value: "Naturel" }, ...]
 */
export const extractTextGroupList = async (adapter: ExtractionAdapter, field: FieldDef): Promise<{ label: string; value: string | null }[]> => {
    const separator = field.groupBySeparator ?? ' - ';
    const texts = await adapter.getTextList(field.selector);
    return texts.map(raw => {
        const idx = raw.indexOf(separator);
        if (idx === -1) return { label: raw, value: null };
        return { label: raw.slice(0, idx).trim(), value: raw.slice(idx + separator.length).trim() };
    });
}

/**
 * Lit un tableau HTML à deux colonnes et retourne un objet clé/valeur.
 * Destiné à être aplati dans le record (`flatten: true`).
 */
export const extractKeyValueTable = async (adapter: ExtractionAdapter, field: FieldDef): Promise<Record<string, string>> => {
    return adapter.getKeyValueTable(
        field.selector,
        field.keyCell ?? 'td:nth-child(1)',
        field.valueCell ?? 'td:nth-child(2)'
    );
}