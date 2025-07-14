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
 *       required:
 *         - id
 *         - productId
 *         - quantity
 *         - price
 *         - createdAt
 *         - updatedAt
 *         - product
 */
export class Cart {
    constructor(
        private readonly _userId: number,
        private readonly _productId: number,
        private readonly _quantity: number,
        private readonly _price: number,
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
}