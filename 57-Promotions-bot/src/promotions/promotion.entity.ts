import { PromotionStatus } from '../common/enums/promotion-status.enum';

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionResponse:
 *       type: object
 *       description: Данные акции, возвращаемые в ответах API, включая связанные категории и город.
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор акции.
 *           example: 1
 *         title:
 *           type: string
 *           description: Название акции (уникальное, максимум 200 символов).
 *           example: "Летняя распродажа 2023"
 *         description:
 *           type: string
 *           description: Описание акции (максимум 1000 символов).
 *           example: "Скидка на летнюю коллекцию"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Дата начала акции в формате ISO 8601. Для предложений поставщиками должна быть в будущем.
 *           example: "2023-06-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Дата окончания акции в формате ISO 8601. Должна быть позже даты начала.
 *           example: "2023-06-30T23:59:59Z"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: Статус акции (PENDING — на рассмотрении, APPROVED — утверждена, REJECTED — отклонена).
 *           example: APPROVED
 *         supplierId:
 *           type: integer
 *           description: Идентификатор поставщика с ролью SUPPLIER, создавшего акцию.
 *           example: 5
 *         cityId:
 *           type: integer
 *           nullable: true
 *           description: Идентификатор города, связанного с акцией. Может быть null.
 *           example: 1
 *         city:
 *           type: object
 *           nullable: true
 *           description: Данные города, связанного с акцией.
 *           properties:
 *             id:
 *               type: integer
 *               description: Идентификатор города.
 *               example: 1
 *             name:
 *               type: string
 *               description: Название города.
 *               example: Москва
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Идентификатор категории.
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: Название категории.
 *                 example: Еда
 *           description: Список категорий, связанных с акцией.
 *           example: [{ id: 1, name: "Еда" }, { id: 2, name: "Напитки" }]
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           description: URL изображения акции.
 *           example: "https://example.com/promo.jpg"
 *         linkUrl:
 *           type: string
 *           nullable: true
 *           description: URL ссылки на акцию.
 *           example: "https://example.com/promo"
 *         publicationDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Дата публикации акции в формате ISO 8601.
 *           example: "2023-06-01T12:00:00Z"
 *         isDeleted:
 *           type: boolean
 *           description: Флаг мягкого удаления акции.
 *           example: false
 *       required:
 *         - id
 *         - title
 *         - description
 *         - startDate
 *         - endDate
 *         - status
 *         - supplierId
 *         - isDeleted
 *   parameters:
 *     PaginationPage:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       description: Номер страницы для пагинации.
 *     PaginationLimit:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 10
 *       description: Количество элементов на странице.
 *     PromotionStatus:
 *       in: query
 *       name: status
 *       schema:
 *         type: string
 *         enum: [PENDING, APPROVED, REJECTED]
 *       description: Фильтр по статусу акции (PENDING, APPROVED, REJECTED).
 *     PromotionActive:
 *       in: query
 *       name: active
 *       schema:
 *         type: boolean
 *       description: Фильтр по активности акции (true — активные, false — неактивные).
 *     PromotionCityId:
 *       in: query
 *       name: cityId
 *       schema:
 *         type: integer
 *       description: Идентификатор города для фильтрации акций.
 *     PromotionCategoryIds:
 *       in: query
 *       name: categoryIds
 *       schema:
 *         type: array
 *         items:
 *           type: integer
 *       description: Идентификаторы категорий для фильтрации акций.
 *     SortBy:
 *       in: query
 *       name: sortBy
 *       schema:
 *         type: string
 *         enum: [createdAt, title, startDate, endDate]
 *       description: Поле для сортировки акций (createdAt, title, startDate, endDate).
 *     SortOrder:
 *       in: query
 *       name: sortOrder
 *       schema:
 *         type: string
 *         enum: [asc, desc]
 *       description: Порядок сортировки (asc — по возрастанию, desc — по убыванию).
 */
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
