import {
	IsArray,
	ValidateNested,
	IsInt,
	Min,
	IsNotEmpty,
	IsOptional,
	Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MESSAGES } from '../../common/messages';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'nonEmptyArray', async: false })
class NonEmptyArray implements ValidatorConstraintInterface {
	validate(items: any[]) {
		return Array.isArray(items) && items.length > 0;
	}

	defaultMessage() {
		return MESSAGES.EMPTY_CART_NOT_ALLOWED;
	}
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CartCheckoutItemDto:
 *       type: object
 *       description: DTO для элемента корзины при оформлении заказа.
 *       properties:
 *         productId:
 *           type: integer
 *           description: Идентификатор товара в корзине.
 *           example: 1
 *           minimum: 1
 *         quantity:
 *           type: integer
 *           description: Количество товара для покупки.
 *           example: 2
 *           minimum: 1
 *       required:
 *         - productId
 *         - quantity
 *     CartCheckoutDto:
 *       type: object
 *       description: DTO для оформления заказа из корзины.
 *       properties:
 *         items:
 *           type: array
 *           description: Список товаров для оформления заказа.
 *           items:
 *             $ref: '#/components/schemas/CartCheckoutItemDto'
 *       required:
 *         - items
 */
export class CartCheckoutItemDto {
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

export class CartCheckoutDto {
	@IsArray({ message: MESSAGES.ITEMS_INVALID_ARRAY })
	@ValidateNested({ each: true })
	@Type(() => CartCheckoutItemDto)
	@Validate(NonEmptyArray)
	items!: CartCheckoutItemDto[];

	@IsInt({ message: MESSAGES.ADDRESS_ID_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.ADDRESS_ID_INVALID_INTEGER })
	@IsNotEmpty({ message: MESSAGES.ADDRESS_ID_REQUIRED_FIELD })
	addressId!: number;
}
