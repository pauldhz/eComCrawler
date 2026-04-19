import { CheerioCrawlingContext } from "@crawlee/cheerio";
import { FieldDef } from "./blueprint-model.js";

type $ = CheerioCrawlingContext['$'];

/** Retourne le texte brut du premier élément correspondant au sélecteur. */
export const extractText = ($: $, field: FieldDef): string  => {
    const text = $(field.selector).first().text();
    return field.transform === 'trim' ? text.trim() : text;
}

/** Filtre les éléments dont le texte contient `filter`, retire le préfixe `replace`. */
export const extractTextFilter = ($: $, field: FieldDef): string => {
    const el = $(field.selector).filter((_, node) =>
        $(node).text().includes(field.filter ?? '')
    );
    let text = el.text();
    if (field.replace) text = text.replace(field.replace, '');
    return field.transform === 'trim' ? text.trim() : text;
}

/** Retourne la valeur d'un attribut HTML sur le premier élément trouvé. */
export const extractAttr = ($: $, field: FieldDef): string | null => {
    return $(field.selector).first().attr(field.attr ?? 'value') ?? null;
}

/**
 * Collecte un attribut sur une liste d'éléments.
 * Si `flatten: true`, retourne un objet `{ image1, image2, ... }` au lieu d'un tableau.
 */
export const extractAttrList = ($: $, field: FieldDef): string[] | Record<string, string | null> => {
    const values: string[] = [];
    $(field.selector).each((_, node) => {
        const val = $(node).attr(field.attr ?? 'href');
        if (val) values.push(val);
    });

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
export const extractTextGroupList = ($: $, field: FieldDef): { label: string; value: string | null }[] => {
    const separator = field.groupBySeparator ?? ' - ';
    const result: { label: string; value: string | null }[] = [];
    $(field.selector).each((_, node) => {
        const raw = $(node).text().trim();
        if (!raw) return;
        const idx = raw.indexOf(separator);
        if (idx === -1) {
            result.push({ label: raw, value: null });
        } else {
            result.push({ label: raw.slice(0, idx).trim(), value: raw.slice(idx + separator.length).trim() });
        }
    });
    return result;
}

/**
 * Lit un tableau HTML à deux colonnes et retourne un objet clé/valeur.
 * Destiné à être aplati dans le record (`flatten: true`).
 */
export const extractKeyValueTable = ($: $, field: FieldDef): Record<string, string> => {
    const specs: Record<string, string> = {};
    $(field.selector).each((_, row) => {
        const key = $(row).find(field.keyCell ?? 'td:nth-child(1)').text().trim();
        const value = $(row).find(field.valueCell ?? 'td:nth-child(2)').text().trim();
        if (key) specs[key] = value;
    });
    return specs;
}