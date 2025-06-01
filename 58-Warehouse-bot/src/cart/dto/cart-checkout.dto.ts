import { IsArray, ValidateNested, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     CartCheckoutItemDto:
 *       type: object
 *       description: Данные элемента корзины для оформления заказа.
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
 *     CartCheckoutDto:
 *       type: object
 *       description: Данные для оформления заказа из корзины.
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           description: Список товаров для оформления.
 *           items:
 *             $ref: '#/components/schemas/CartCheckoutItemDto'
 */
export class CartCheckoutItemDto {
	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Идентификатор товара') })
	@Min(1, { message: MESSAGES.INVALID_ID })
	productId!: number;

	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
	@Min(1, { message: MESSAGES.QUANTITY_NEGATIVE })
	quantity!: number;
}

export class CartCheckoutDto {
	@IsArray({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Список товаров') })
	@ValidateNested({ each: true })
	@Type(() => CartCheckoutItemDto)
	items!: CartCheckoutItemDto[];
}
