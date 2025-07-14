import {
    IsString,
    IsNumber,
    IsOptional,
    MaxLength,
    IsArray,
    IsInt,
    Min,
    ArrayMinSize,
    ArrayMaxSize,
    Validate,
    IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { NonEmptyObjectValidator } from './validators/non-empty-object.validator';
import { MESSAGES } from '../../common/messages';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { PRODUCT_STATUSES } from '../../common/constants';

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductUpdateDto:
 *       type: object
 *       description: DTO для обновления товара. Должен содержать хотя бы одно заполненное поле.
 *       properties:
 *         name:
 *           type: string
 *           description: Название товара.
 *           example: "Ноутбук HP EliteBook"
 *           maxLength: 200
 *           nullable: true
 *         description:
 *           type: string
 *           description: Описание товара.
 *           example: "15.6\", Core i7, 16GB RAM"
 *           maxLength: 1000
 *           nullable: true
 *         price:
 *           type: number
 *           format: float
 *           description: Цена товара.
 *           example: 1250.99
 *           minimum: 0
 *           nullable: true
 *         quantity:
 *           type: integer
 *           description: Количество товара на складе.
 *           example: 10
 *           minimum: 0
 *           nullable: true
 *         sku:
 *           type: string
 *           description: Уникальный артикул товара.
 *           example: "NB-HP-ELITE-001"
 *           nullable: true
 *         cityId:
 *           type: integer
 *           description: Идентификатор города, связанного с товаром.
 *           example: 1
 *           minimum: 1
 *           nullable: true
 *         categoryIds:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 1
 *           description: Список идентификаторов категорий, связанных с товаром.
 *           example: [1, 2]
 *           minItems: 1
 *           maxItems: 50
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
 *           description: Статус товара (AVAILABLE — в наличии, OUT_OF_STOCK — отсутствует, DISCONTINUED — снят с производства).
 *           example: AVAILABLE
 *           nullable: true
 */
export class ProductUpdateDto {
    @IsString({ message: MESSAGES.NAME_INVALID_FORMAT })
    @MaxLength(200, { message: MESSAGES.NAME_INVALID_LENGTH })
    @IsOptional()
    name?: string;

    @IsString({ message: MESSAGES.DESCRIPTION_INVALID_FORMAT })
    @MaxLength(1000, { message: MESSAGES.DESCRIPTION_INVALID_LENGTH })
    @IsOptional()
    description?: string | null;

    @IsNumber({}, { message: MESSAGES.PRICE_INVALID_FORMAT })
    @Min(0, { message: MESSAGES.PRICE_NEGATIVE })
    @IsOptional()
    price?: number;

    @IsInt({ message: MESSAGES.QUANTITY_INVALID_FORMAT })
    @Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
    @IsOptional()
    quantity?: number;

    @IsString({ message: MESSAGES.SKU_INVALID_FORMAT })
    @IsOptional()
    sku?: string;

    @IsInt({ message: MESSAGES.CITY_ID_INVALID_INTEGER })
    @Min(1, { message: MESSAGES.CITY_ID_INVALID_INTEGER })
    @IsOptional()
    cityId?: number;

    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value
                .split(',')
                .map(Number)
                .filter((id) => !isNaN(id) && id >= 1);
        }
        return value;
    })
    @IsArray({ message: MESSAGES.CATEGORY_IDS_INVALID_FORMAT })
    @IsInt({ each: true, message: MESSAGES.CATEGORY_IDS_INVALID_INTEGER })
    @Min(1, { each: true, message: MESSAGES.CITY_ID_INVALID_INTEGER })
    @ArrayMinSize(1, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE_MIN })
    @ArrayMaxSize(50, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE })
    @IsOptional()
    categoryIds?: number[];

    @IsIn(PRODUCT_STATUSES, { message: MESSAGES.STATUS_INVALID_FORMAT })
    @IsOptional()
    status?: ProductStatus;

    @Validate(NonEmptyObjectValidator, [], {
        message: MESSAGES.NON_EMPTY_OBJECT_VALIDATION_FAILED,
    })
    private nonEmptyValidation?: boolean;
}