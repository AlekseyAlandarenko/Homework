import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductUpdateDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Ноутбук HP EliteBook
 *         description:
 *           type: string
 *           example: 15.6", Core i7, 16GB RAM
 *         price:
 *           type: number
 *           format: float
 *           example: 1250.99
 *         quantity:
 *           type: integer
 *           example: 10
 *         category:
 *           type: string
 *           example: Электроника
 *         sku:
 *           type: string
 *           example: NB-HP-ELITE-001
 *         isActive:
 *           type: boolean
 *           example: true
 */
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
