import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

export class ProductPurchaseOrAddQuantityDto {
    @IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
    @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Количество') })
    @Min(1, { message: MESSAGES.QUANTITY_ZERO_OR_NEGATIVE })
    quantity!: number;
}
