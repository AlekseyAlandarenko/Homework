import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

export class ProductCreateDto {
    @IsString({ message: MESSAGES.INVALID_NAME })
    @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Название') })
    name!: string;

    @IsString({ message: MESSAGES.INVALID_DESCRIPTION })
    @IsOptional()
    description?: string;

    @IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Цена') })
    @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Цена') })
    @Min(0, { message: MESSAGES.PRICE_NEGATIVE })
    price!: number;

    @IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
    @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Количество') })
    @Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
    quantity!: number;

    @IsString({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Категория') })
    @IsOptional()
    category?: string;

    @IsString({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Артикул') })
    @IsOptional()
    sku?: string;

    @IsBoolean({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Статус') })
    @IsOptional()
    isActive?: boolean;
}
