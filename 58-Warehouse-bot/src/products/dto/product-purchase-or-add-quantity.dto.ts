import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductPurchaseOrAddQuantityDto:
 *       type: object
 *       description: Данные для изменения количества товара.
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           description: Количество товара для добавления или покупки.
 *           example: 5
 */
export class ProductPurchaseOrAddQuantityDto {
	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
	@Min(1, { message: MESSAGES.QUANTITY_NEGATIVE })
	quantity!: number;
}
