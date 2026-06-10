// centimeters
export type Dimensions = Record<string,Record<string,string>>;

export interface Property {
    name: string;
    value: string;
}

export interface ScrappingModel {
    url?: string;
    title?: string;
    reference?: string;
    price?: string;
    shortDescription?: string;
    description?: string;
    imageLinks: string[];
    colors: string[];
    category?: string;
    subcategory?: string;
    matter: string[];
    deliveryCosts?: string;
    specialOfferPrice?: string;
    reviews?: number;
    note?: string;
    pictures: string[];
    dimensions?: Dimensions;
    properties: Property[];
}

export class ScrappingModelBuilder {
    private _url?: string;
    private _title?: string;
    private _reference?: string;
    private _price?: string;
    private _specialOfferPrice?: string;
    private _shortDescription?: string;
    private _description?: string;
    private _imageLinks: string[] = [];
    private _colors: string[] = [];
    private _category?: string;
    private _subcategory?: string;
    private _matter: string[] = [];
    private _deliveryCosts?: string;
    private _reviews?: number;
    private _note?: string;
    private _pictures: string[] = [];
    private _dimensions?: Dimensions;
    private _properties: Property[] = [];

    constructor() {}

    public url(url: string): ScrappingModelBuilder {
        this._url = url;
        return this;
    }

    public title(title: string): ScrappingModelBuilder {
        this._title = title;
        return this;
    }

    public reference(reference: string): ScrappingModelBuilder {
        this._reference = reference;
        return this;
    }

    public price(price: string): ScrappingModelBuilder {
        this._price = price;
        return this;
    }

    public shortDescription(text: string): ScrappingModelBuilder {
        this._shortDescription = text;
        return this;
    }

    public description(text: string): ScrappingModelBuilder {
        this._description = text;
        return this;
    }

    public imageLinks(links: string[]): ScrappingModelBuilder {
        this._imageLinks = [...links];
        return this;
    }

    public addImageLink(link: string): ScrappingModelBuilder {
        this._imageLinks.push(link);
        return this;
    }

    public colors(colors: string[] | string): ScrappingModelBuilder {
        this._colors = Array.isArray(colors) ? colors : [colors];
        return this;
    }

    public category(category: string): ScrappingModelBuilder {
        this._category = category;
        return this;
    }

    public subcategory(subcategory: string): ScrappingModelBuilder {
        this._subcategory = subcategory;
        return this;
    }

    public matter(matter: string[] | string): ScrappingModelBuilder {
        this._matter = Array.isArray(matter) ? matter : [matter];
        return this;
    }

    public addMatter(m: string): ScrappingModelBuilder {
        this._matter.push(m);
        return this;
    }

    public deliveryCosts(costs: string): ScrappingModelBuilder {
        this._deliveryCosts = costs;
        return this;
    }

    public specialOfferPrice(price?: string): ScrappingModelBuilder {
        if(price !== null) 
            this._specialOfferPrice = price;
        return this;
    }

    public reviews(count: number): ScrappingModelBuilder {
        this._reviews = count;
        return this;
    }

    public note(text: string): ScrappingModelBuilder {
        this._note = text;
        return this;
    }

    public pictures(pics: string[]): ScrappingModelBuilder {
        this._pictures = [...pics];
        return this;
    }

    public addPicture(pic: string): ScrappingModelBuilder {
        this._pictures.push(pic);
        return this;
    }

    public dimensions(dimensions: Dimensions): ScrappingModelBuilder {
        this._dimensions = dimensions;
        return this;
    }

    public properties(props: Property[]): ScrappingModelBuilder {
        this._properties = [...props];
        return this;
    }

    public addProperty(name: string, value: string): ScrappingModelBuilder {
        this._properties.push({ name, value });
        return this;
    }

    public build(): ScrappingModel {
        return {
            url: this._url,
            title: this._title,
            reference: this._reference,
            price: this._price,
            shortDescription: this._shortDescription,
            description: this._description,
            imageLinks: this._imageLinks,
            colors: this._colors,
            category: this._category,
            subcategory: this._subcategory,
            matter: this._matter,
            deliveryCosts: this._deliveryCosts,
            specialOfferPrice: this._specialOfferPrice,
            reviews: this._reviews,
            note: this._note,
            pictures: this._pictures,
            dimensions: this._dimensions,
            properties: this._properties,
        };
    }
}

