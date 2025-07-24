/**
 * @swagger
 * components:
 *   schemas:
 *     CartResponse:
 *       type: object
 *       description: Данные элемента корзины, возвращаемые в ответах API.
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор элемента корзины.
 *           example: 1
 *         productId:
 *           type: integer
 *           description: Идентификатор товара.
 *           example: 1
 *         quantity:
 *           type: integer
 *           description: Количество товара в корзине.
 *           example: 2
 *         price:
 *           type: number
 *           format: float
 *           description: Цена товара на момент добавления в корзину.
 *           example: 1250.99
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата добавления элемента в корзину (ISO 8601).
 *           example: "2023-06-01T00:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления элемента (ISO 8601).
 *           example: "2023-06-02T12:00:00Z"
 *         product:
 *           type: object
 *           description: Информация о товаре.
 *           properties:
 *             name:
 *               type: string
 *               description: Название товара.
 *               example: "Ноутбук HP EliteBook"
 *           required:
 *             - name
 *         option:
 *           type: object
 *           nullable: true
 *           description: Информация об опции товара (если выбрана).
 *           properties:
 *             id:
 *               type: integer
 *               description: Идентификатор опции.
 *               example: 1
 *             name:
 *               type: string
 *               description: Название опции.
 *               example: "Цвет"
 *             value:
 *               type: string
 *               description: Значение опции.
 *               example: "Чёрный"
 *             priceModifier:
 *               type: number
 *               format: float
 *               description: Модификатор цены для опции.
 *               example: 100.00
 *           required:
 *             - id
 *             - name
 *             - value
 *             - priceModifier
 *       required:
 *         - id
 *         - productId
 *         - quantity
 *         - price
 *         - createdAt
 *         - updatedAt
 *         - product
 *     CartResponseDto:
 *       type: object
 *       description: Ответ со списком элементов корзины и общей суммой.
 *       properties:
 *         items:
 *           type: array
 *           description: Список элементов корзины.
 *           items:
 *             $ref: '#/components/schemas/CartResponse'
 *         total:
 *           type: number
 *           format: float
 *           description: Общая сумма товаров в корзине.
 *           example: 2501.98
 *       required:
 *         - items
 *         - total
 */
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
