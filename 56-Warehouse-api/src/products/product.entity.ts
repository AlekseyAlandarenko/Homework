/**
 * @swagger
 * components:
 *   schemas:
 *     ProductResponse:
 *       type: object
 *       description: Данные товара, возвращаемые в ответах API.
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор товара.
 *           example: 1
 *         name:
 *           type: string
 *           description: Название товара.
 *           example: "Ноутбук HP EliteBook"
 *         description:
 *           type: string
 *           description: Описание товара.
 *           example: "15.6\", Core i7, 16GB RAM"
 *         price:
 *           type: number
 *           format: float
 *           description: Цена товара.
 *           example: 1250.99
 *         quantity:
 *           type: integer
 *           description: Количество товара на складе.
 *           example: 10
 *         category:
 *           type: string
 *           description: Категория товара.
 *           example: "Электроника"
 *         sku:
 *           type: string
 *           description: Уникальный артикул товара.
 *           example: "NB-HP-ELITE-001"
 *         isActive:
 *           type: boolean
 *           description: Статус активности товара.
 *           example: true
 *         isDeleted:
 *           type: boolean
 *           description: Флаг мягкого удаления.
 *           example: false
 *         createdById:
 *           type: integer
 *           description: Идентификатор пользователя, создавшего товар.
 *           example: 5
 *         updatedById:
 *           type: integer
 *           description: Идентификатор пользователя, обновившего товар.
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания товара (ISO 8601).
 *           example: "2023-06-01T00:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления товара (ISO 8601).
 *           example: "2023-06-02T12:00:00Z"
 *       required:
 *         - id
 *         - name
 *         - price
 *         - quantity
 *         - sku
 *         - createdById
 */
export class Product {
	constructor(
		private readonly _name: string,
		private readonly _description: string | null,
		private readonly _price: number,
		private readonly _quantity: number,
		private readonly _category: string | null,
		private readonly _sku: string,
		private readonly _isActive: boolean = true,
		private readonly _isDeleted: boolean = false,
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

	get sku(): string {
		return this._sku;
	}

	get isActive(): boolean {
		return this._isActive;
	}

	get isDeleted(): boolean {
		return this._isDeleted;
	}

	get createdById(): number {
		return this._createdById;
	}

	get updatedById(): number | undefined {
		return this._updatedById;
	}
}
