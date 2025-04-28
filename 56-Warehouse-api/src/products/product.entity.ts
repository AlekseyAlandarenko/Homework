export class Product {
    constructor(
        private readonly _name: string,
        private readonly _description: string | null,
        private readonly _price: number,
        private readonly _quantity: number,
        private readonly _category: string | null,
        private readonly _sku: string | null,
        private readonly _isActive: boolean = true,
        private readonly _createdById: number,
        private readonly _updatedById?: number,
    ) {}

    get name(): string {
        return this._name;
    }

    get description(): string | null {
        return this._description;
    }

    get price(): number {
        return this._price;
    }

    get quantity(): number {
        return this._quantity;
    }

    get category(): string | null {
        return this._category;
    }

    get sku(): string | null {
        return this._sku;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get createdById(): number {
        return this._createdById;
    }

    get updatedById(): number | undefined {
        return this._updatedById;
    }
}
