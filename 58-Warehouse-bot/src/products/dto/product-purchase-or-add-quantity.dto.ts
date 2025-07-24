import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductPurchaseOrAddQuantityDto:
 *       type: object
 *       description: DTO для покупки или изменения количества товара.
 *       properties:
 *         quantity:
 *           type: integer
 *           description: Количество товара для покупки или добавления.
 *           example: 5
 *           minimum: 1
 *       required:
 *         - quantity
 */
export class ProductPurchaseOrAddQuantityDto {
	@IsInt({ message: MESSAGES.QUANTITY_INVALID_FORMAT })
	@Min(1, { message: MESSAGES.QUANTITY_NOT_POSITIVE })
	@IsNotEmpty({ message: MESSAGES.QUANTITY_REQUIRED_FIELD })
	quantity!: number;
}
