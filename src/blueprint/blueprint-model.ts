/**
 * Mode d'extraction d'un champ :
 * - `text`            → récupère le `.text()` de l'élément sélectionné
 * - `text-filter`     → filtre d'abord plusieurs éléments selon `filter`, puis extrait le texte
 * - `attr`            → récupère la valeur d'un attribut HTML (ex: `value`, `href`, `src`)
 * - `attr-list`       → collecte un attribut sur une liste d'éléments (ex: tous les `href` d'une galerie)
 * - `key-value-table` → lit un tableau HTML à deux colonnes et construit un objet clé/valeur
 */
export type FieldType = 'text' | 'text-filter' | 'attr' | 'attr-list' | 'key-value-table';

/**
 * Définition d'un champ à extraire sur une page produit.
 */
interface FieldDef {
    /** Nom de la colonne dans le dataset exporté (ex: "price", "title"). */
    key: string;

    /** Sélecteur CSS Cheerio ciblant le ou les éléments HTML à lire. */
    selector: string;

    /** Mode d'extraction — voir `FieldType`. */
    type: FieldType;

    /** Transformation à appliquer après extraction. `'trim'` supprime les espaces en début/fin. */
    transform?: 'trim';

    /**
     * (type `text-filter` uniquement)
     * Chaîne que le texte de l'élément doit contenir pour être sélectionné.
     * Ex: `"Référence"` pour isoler le `<li>` contenant la référence produit.
     */
    filter?: string;

    /**
     * (type `text-filter` uniquement)
     * Préfixe à retirer du texte une fois l'élément trouvé.
     * Ex: `"Référence :"` pour ne garder que la valeur après le libellé.
     */
    replace?: string;

    /**
     * (types `attr` et `attr-list`)
     * Nom de l'attribut HTML à lire sur l'élément.
     * Ex: `"href"`, `"src"`, `"value"`.
     */
    attr?: string;

    /**
     * Si `true`, le résultat (objet ou liste) est aplati directement dans le record du dataset
     * au lieu d'être imbriqué. Utilisé avec `key-value-table` et `attr-list`.
     * Ex: `{ "Structure": "Aluminium" }` devient une colonne `Structure` dans le CSV.
     */
    flatten?: boolean;

    /**
     * (type `attr-list` avec `flatten: true`)
     * Nombre maximum d'éléments à collecter dans la liste.
     * Ex: `5` pour ne garder que les 5 premières images.
     */
    maxItems?: number;

    /**
     * (type `attr-list` avec `flatten: true`)
     * Préfixe des colonnes générées lors de l'aplatissement.
     * Ex: `"image"` produit `image1`, `image2`, `image3`...
     * Par défaut, utilise la valeur de `key`.
     */
    keyPrefix?: string;

    /**
     * (type `key-value-table`)
     * Sélecteur CSS de la cellule contenant la clé dans chaque ligne du tableau.
     * Par défaut : `"td:nth-child(1)"`.
     */
    keyCell?: string;

    /**
     * (type `key-value-table`)
     * Sélecteur CSS de la cellule contenant la valeur dans chaque ligne du tableau.
     * Par défaut : `"td:nth-child(2)"`.
     */
    valueCell?: string;
}

/**
 * Configuration de la découverte de liens depuis une page vers le niveau suivant.
 */
interface EnqueueDef {
    /**
     * Patterns glob des URLs à enqueuer parmi tous les liens présents sur la page.
     * Ex: `["https://www.terria.fr/index.php?route=product/product**"]`
     */
    globs: string[];

    /** Label à attribuer aux requêtes enqueued — doit correspondre à un `LevelDef.label`. */
    label: string;
}

/**
 * Représente un niveau de navigation du crawler (ex: HOME → CATEGORY → PRODUCT).
 */
interface LevelDef {
    /**
     * Identifiant unique du niveau, utilisé comme label de routing par Crawlee.
     * Doit être cohérent entre `startUrls`, `EnqueueDef.label` et ce champ.
     */
    label: string;

    /**
     * URLs de départ pour lancer le crawler. Présent uniquement sur le premier niveau.
     * Chaque entrée doit avoir un `label` correspondant à ce `LevelDef.label`.
     */
    startUrls?: { url: string; label: string }[];

    /**
     * Définit comment découvrir les URLs du niveau suivant depuis les pages de ce niveau.
     * Absent sur le dernier niveau (PRODUCT) qui scrape au lieu de naviguer.
     */
    enqueueLinks?: EnqueueDef;

    /**
     * Liste des champs à extraire. Présent uniquement sur le niveau final (ex: PRODUCT).
     * Absent sur les niveaux intermédiaires qui se contentent d'enqueuer des liens.
     */
    fields?: FieldDef[];
}

/**
 * Racine du blueprint — décrit un site e-commerce à crawler de façon déclarative.
 * Chargé depuis un fichier JSON par le `BlueprintRunner`.
 */
interface Blueprint {
    /** Métadonnées du site ciblé. */
    site: {
        /** Nom lisible du site — utilisé pour les logs et le nommage des exports. */
        name: string;

        /** URL de base du site, sans slash final. Ex: `"https://www.terria.fr"`. */
        baseUrl: string;

        /**
         * Moteur de crawling à utiliser.
         * `'cheerio'` : parsing HTML statique, rapide, sans JS.
         * (D'autres moteurs comme `'playwright'` pourront être ajoutés.)
         */
        engine: 'cheerio';
    };

    /**
     * Séquence ordonnée des niveaux de navigation.
     * Le premier niveau contient les `startUrls`, le dernier contient les `fields`.
     */
    levels: LevelDef[];
}

export type { FieldDef, EnqueueDef, LevelDef, Blueprint };