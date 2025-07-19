import { ProductStatus } from '../common/enums/product-status.enum';

export class Product {
	constructor(
		private readonly _name: string,
		private readonly _description: string | null,
		private readonly _price: number,
		private readonly _quantity: number,
		private readonly _sku: string,
		private readonly _status: ProductStatus = ProductStatus.AVAILABLE,
		private readonly _createdById: number,
		private readonly _updatedById: number | null = null,
		private readonly _cityId: number | null = null,
		private readonly _categoryIds: number[] = [],
		private readonly _options: { name: string; value: string; priceModifier: number }[] = [],
		private readonly _isDeleted: boolean = false,
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

	get sku(): string {
		return this._sku;
	}

	get status(): ProductStatus {
		return this._status;
	}

	get createdById(): number {
		return this._createdById;
	}

	get updatedById(): number | null {
		return this._updatedById;
	}

	get cityId(): number | null {
		return this._cityId;
	}

	get categoryIds(): number[] {
		return this._categoryIds;
	}

	get options(): { name: string; value: string; priceModifier: number }[] {
		return this._options;
	}

	get isDeleted(): boolean {
		return this._isDeleted;
	}
}
