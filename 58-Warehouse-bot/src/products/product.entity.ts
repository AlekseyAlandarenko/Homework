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
 *           type: object
 *           description: Город, связанный с товаром.
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *               description: Уникальный идентификатор города.
 *               example: 1
 *             name:
 *               type: string
 *               description: Название города.
 *               example: Москва
 *           required:
 *             - id
 *             - name
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             description: Категория товара.
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Уникальный идентификатор категории.
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: Название категории.
 *                 example: Электроника
 *             required:
 *               - id
 *               - name
 *           description: Категории, связанные с товаром.
 *           example: [{ id: 1, name: "Электроника" }]
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             description: Опция товара.
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Уникальный идентификатор опции.
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: Название опции.
 *                 example: Цвет
 *               value:
 *                 type: string
 *                 description: Значение опции.
 *                 example: Черный
 *               priceModifier:
 *                 type: number
 *                 format: float
 *                 description: Модификатор цены для опции.
 *                 example: 0
 *             required:
 *               - id
 *               - name
 *               - value
 *               - priceModifier
 *           description: Опции товара.
 *           example: [{ id: 1, name: "Цвет", value: "Черный", priceModifier: 0 }]
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
 *   parameters:
 *     PaginationPage:
 *       name: page
 *       in: query
 *       description: Номер страницы для пагинации.
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *         example: 1
 *     PaginationLimit:
 *       name: limit
 *       in: query
 *       description: Количество элементов на странице.
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *         example: 10
 *     ProductStatus:
 *       name: status
 *       in: query
 *       description: Статус товара (AVAILABLE, OUT_OF_STOCK, DISCONTINUED).
 *       required: false
 *       schema:
 *         type: string
 *         enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
 *         example: AVAILABLE
 *     ProductCityId:
 *       name: cityId
 *       in: query
 *       description: Идентификатор города, связанного с товаром.
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         example: 1
 *     ProductCategoryIds:
 *       name: categoryIds
 *       in: query
 *       description: Список идентификаторов категорий, связанных с товаром (через запятую).
 *       required: false
 *       schema:
 *         type: string
 *         example: "1,2,3"
 *     ProductName:
 *       name: name
 *       in: query
 *       description: Название товара для фильтрации (частичное совпадение).
 *       required: false
 *       schema:
 *         type: string
 *         example: "Ноутбук"
 *     ProductMinPrice:
 *       name: minPrice
 *       in: query
 *       description: Минимальная цена товара для фильтрации.
 *       required: false
 *       schema:
 *         type: number
 *         format: float
 *         minimum: 0
 *         example: 100.0
 *     ProductMaxPrice:
 *       name: maxPrice
 *       in: query
 *       description: Максимальная цена товара для фильтрации.
 *       required: false
 *       schema:
 *         type: number
 *         format: float
 *         minimum: 0
 *         example: 2000.0
 *     ProductQuantity:
 *       name: quantity
 *       in: query
 *       description: Количество товара для фильтрации (точное значение или диапазон).
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 0
 *         example: 10
 *     SortBy:
 *       name: sortBy
 *       in: query
 *       description: Поле для сортировки (name, price, quantity, createdAt).
 *       required: false
 *       schema:
 *         type: string
 *         enum: [name, price, quantity, createdAt]
 *         example: price
 *     SortOrder:
 *       name: sortOrder
 *       in: query
 *       description: Порядок сортировки (asc или desc).
 *       required: false
 *       schema:
 *         type: string
 *         enum: [asc, desc]
 *         example: asc
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
        return [...this._categoryIds];
    }

    get options(): { name: string; value: string; priceModifier: number }[] {
        return [...this._options];
    }

    get isDeleted(): boolean {
        return this._isDeleted;
    }
}