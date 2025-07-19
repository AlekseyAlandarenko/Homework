export class Cart {
	constructor(
		private readonly _userId: number,
		private readonly _productId: number,
		private readonly _quantity: number,
		private readonly _price: number,
		private readonly _optionId: number | null = null,
	) {}

	get userId(): number {
		return this._userId;
	}

	get productId(): number {
		return this._productId;
	}

	get quantity(): number {
		return this._quantity;
	}

	get price(): number {
		return this._price;
	}

	get optionId(): number | null {
		return this._optionId;
	}
}
