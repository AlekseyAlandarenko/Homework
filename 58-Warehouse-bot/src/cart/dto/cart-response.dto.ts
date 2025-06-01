import { IsArray, IsNumber } from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     CartResponseDto:
 *       type: object
 *       description: Данные корзины, возвращаемые в ответах API.
 *       properties:
 *         items:
 *           type: array
 *           description: Список элементов корзины.
 *           items:
 *             $ref: '#/components/schemas/CartResponse'
 *         total:
 *           type: number
 *           format: float
 *           description: Итоговая сумма корзины.
 *           example: 2501.98
 */
export interface CartResponse {
	id: number;
	productId: number;
	quantity: number;
	price: number;
	createdAt: string;
	updatedAt: string;
}

export class CartResponseDto {
	@IsArray()
	items!: CartResponse[];

	@IsNumber()
	total!: number;
}
