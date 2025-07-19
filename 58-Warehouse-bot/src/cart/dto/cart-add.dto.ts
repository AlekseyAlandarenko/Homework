import { IsInt, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { MESSAGES } from '../../common/messages';

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
