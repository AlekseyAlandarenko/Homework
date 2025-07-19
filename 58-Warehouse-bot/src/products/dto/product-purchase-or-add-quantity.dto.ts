import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

export class ProductPurchaseOrAddQuantityDto {
	@IsInt({ message: MESSAGES.QUANTITY_INVALID_FORMAT })
	@Min(1, { message: MESSAGES.QUANTITY_NOT_POSITIVE })
	@IsNotEmpty({ message: MESSAGES.QUANTITY_REQUIRED_FIELD })
	quantity!: number;
}
