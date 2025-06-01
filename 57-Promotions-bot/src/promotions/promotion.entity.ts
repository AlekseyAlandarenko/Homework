import { PromotionStatus } from '../common/constants';

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionResponse:
 *       type: object
 *       description: Данные акции, возвращаемые в ответах API.
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор акции.
 *           example: 1
 *         title:
 *           type: string
 *           description: Название акции.
 *           example: "Летняя распродажа 2023"
 *         description:
 *           type: string
 *           description: Описание акции.
 *           example: "Скидка на летнюю коллекцию"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Дата начала акции (ISO 8601). Для предложений должна быть в будущем.
 *           example: "2023-06-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Дата окончания акции (ISO 8601). Должна быть позже даты начала.
 *           example: "2023-06-30T23:59:59Z"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: Статус акции (PENDING — ожидает, APPROVED — утверждена, REJECTED — отклонена).
 *           example: "APPROVED"
 *         supplierId:
 *           type: integer
 *           description: Идентификатор поставщика (роль SUPPLIER), создавшего акцию.
 *           example: 5
 *         isDeleted:
 *           type: boolean
 *           description: Флаг мягкого удаления.
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания акции (ISO 8601).
 *           example: "2023-05-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления акции (ISO 8601).
 *           example: "2023-05-02T12:00:00Z"
 *       required:
 *         - id
 *         - title
 *         - description
 *         - startDate
 *         - endDate
 *         - status
 *         - supplierId
 *         - isDeleted
 */
export class Promotion {
	constructor(
		private readonly _title: string,
		private readonly _description: string,
		private readonly _startDate: Date,
		private readonly _endDate: Date,
		private readonly _status: PromotionStatus = 'PENDING',
		private readonly _supplierId: number,
		private readonly _isDeleted: boolean = false,
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

	get status(): PromotionStatus {
		return this._status;
	}

	get supplierId(): number {
		return this._supplierId;
	}

	get isDeleted(): boolean {
		return this._isDeleted;
	}
}
