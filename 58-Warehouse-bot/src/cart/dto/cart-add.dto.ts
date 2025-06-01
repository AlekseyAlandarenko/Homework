import { IsNumber, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     CartAddDto:
 *       type: object
 *       description: Данные для добавления товара в корзину.
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: integer
 *           description: Идентификатор товара.
 *           example: 1
 *         quantity:
 *           type: integer
 *           description: Количество товара.
 *           example: 2
 */
export class CartAddDto {
	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Идентификатор товара') })
	@Min(1, { message: MESSAGES.INVALID_ID })
	productId!: number;

	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
	@Min(1, { message: MESSAGES.QUANTITY_NEGATIVE })
	quantity!: number;
}
