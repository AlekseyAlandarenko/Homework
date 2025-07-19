import { PromotionStatus } from '../common/enums/promotion-status.enum';

export class Promotion {
	constructor(
		private readonly _title: string,
		private readonly _description: string,
		private readonly _startDate: Date,
		private readonly _endDate: Date,
		private readonly _status: PromotionStatus = PromotionStatus.PENDING,
		private readonly _supplierId: number,
		private readonly _cityId: number | null = null,
		private readonly _categoryIds: number[] = [],
		private readonly _publicationDate: Date | null = null,
		private readonly _imageUrl: string | null = null,
		private readonly _linkUrl: string | null = null,
		private readonly _isDeleted: boolean = false,
		private readonly _id?: number,
	) {}

	get id(): number | undefined {
		return this._id;
	}

	get title(): string {
		return this._title;
	}

	get description(): string {
		return this._description;
	}

	get startDate(): Date {
		return this._startDate;
	}

	get endDate(): Date {
		return this._endDate;
	}

	get status(): PromotionStatus {
		return this._status;
	}

	get supplierId(): number {
		return this._supplierId;
	}

	get cityId(): number | null {
		return this._cityId;
	}

	get categoryIds(): number[] {
		return this._categoryIds;
	}

	get publicationDate(): Date | null {
		return this._publicationDate;
	}

	get imageUrl(): string | null {
		return this._imageUrl;
	}

	get linkUrl(): string | null {
		return this._linkUrl;
	}

	get isDeleted(): boolean {
		return this._isDeleted;
	}
}
