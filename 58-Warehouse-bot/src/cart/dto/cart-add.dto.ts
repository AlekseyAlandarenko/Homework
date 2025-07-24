import { IsInt, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     CartAddDto:
 *       type: object
 *       description: DTO для добавления товара в корзину.
 *       properties:
 *         productId:
 *           type: integer
 *           description: Идентификатор товара, добавляемого в корзину.
 *           example: 1
 *           minimum: 1
 *         quantity:
 *           type: integer
 *           description: Количество товара для добавления.
 *           example: 2
 *           minimum: 1
 *       required:
 *         - productId
 *         - quantity
 */
export class CartAddDto {
	@IsInt({ message: MESSAGES.PRODUCT_ID_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.PRODUCT_ID_INVALID_INTEGER })
	@IsNotEmpty({ message: MESSAGES.PRODUCT_ID_REQUIRED_FIELD })
	productId!: number;

	@IsInt({ message: MESSAGES.QUANTITY_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.QUANTITY_NOT_POSITIVE })
	@IsNotEmpty({ message: MESSAGES.QUANTITY_REQUIRED_FIELD })
	quantity!: number;

	@IsInt({ message: MESSAGES.OPTION_ID_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.OPTION_ID_INVALID_INTEGER })
	@IsOptional()
	optionId?: number | null;
}
