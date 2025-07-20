import { IsArray, IsNumber, IsNotEmpty } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { CartResponse } from '../cart.repository.interface';

/**
 * @swagger
 * components:
 *   schemas:
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
export class CartResponseDto {
	@IsArray({ message: MESSAGES.ITEMS_INVALID_ARRAY })
	@IsNotEmpty({ message: MESSAGES.ITEMS_REQUIRED_FIELD })
	items!: CartResponse[];

	@IsNumber({}, { message: MESSAGES.TOTAL_INVALID_FORMAT })
	@IsNotEmpty({ message: MESSAGES.TOTAL_REQUIRED_FIELD })
	total!: number;
}
