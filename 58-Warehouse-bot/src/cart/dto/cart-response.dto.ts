import { IsArray, IsNumber, IsNotEmpty, IsString } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     CartResponse:
 *       type: object
 *       description: Ответ с данными одного элемента корзины.
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
export interface CartResponse {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    createdAt: string;
    updatedAt: string;
    product: {
        name: string;
    };
}

export class CartResponseDto {
    @IsArray({ message: MESSAGES.ITEMS_INVALID_ARRAY })
    @IsNotEmpty({ message: MESSAGES.ITEMS_REQUIRED_FIELD })
    items!: CartResponse[];

    @IsNumber({}, { message: MESSAGES.TOTAL_INVALID_FORMAT })
    @IsNotEmpty({ message: MESSAGES.TOTAL_REQUIRED_FIELD })
    total!: number;
}
