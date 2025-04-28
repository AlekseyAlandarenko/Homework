import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

export class ProductUpdateDto {
    @IsString({ message: MESSAGES.INVALID_NAME })
    @IsOptional()
    name?: string;

    @IsString({ message: MESSAGES.INVALID_DESCRIPTION })
    @IsOptional()
    description?: string;

    @IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Цена') })
    @IsOptional()
    @Min(0, { message: MESSAGES.PRICE_NEGATIVE })
    price?: number;

    @IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
    @IsOptional()
    @Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
    quantity?: number;

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
