import { ProductStatus } from '../common/enums/product-status.enum';

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
 *           nullable: true
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
 *         sku:
 *           type: string
 *           description: Уникальный артикул товара.
 *           example: "NB-HP-ELITE-001"
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
 *           description: Статус товара (AVAILABLE — в наличии, OUT_OF_STOCK — отсутствует, DISCONTINUED — снят с производства).
 *           example: AVAILABLE
 *         createdById:
 *           type: integer
 *           description: Идентификатор пользователя, создавшего товар.
 *           example: 5
 *         updatedById:
 *           type: integer
 *           nullable: true
 *           description: Идентификатор пользователя, обновившего товар.
 *           example: 5
 *         cityId:
 *           type: integer
 *           nullable: true
 *           description: Идентификатор города, связанного с товаром.
 *           example: 1
 *         city:
 *           $ref: '#/components/schemas/CityResponse'
 *           description: Город, связанный с товаром.
 *           nullable: true
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryResponse'
 *           description: Категории, связанные с товаром.
 *           example: [{ id: 1, name: "Электроника" }]
 *         isDeleted:
 *           type: boolean
 *           description: Флаг мягкого удаления.
 *           example: false
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
 *         - status
 *         - createdById
 *         - isDeleted
 */
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

    get isDeleted(): boolean {
        return this._isDeleted;
    }
}