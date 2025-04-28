export class Promotion {
	constructor(
		private readonly _title: string,
		private readonly _description: string,
		private readonly _startDate: Date,
		private readonly _endDate: Date,
		private readonly _status: string = 'PENDING',
		private readonly _supplierId: number,
	) {}

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

	get status(): string {
		return this._status;
	}

	get supplierId(): number {
		return this._supplierId;
	}
}
