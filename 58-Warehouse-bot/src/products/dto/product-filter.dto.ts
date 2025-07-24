import {
	IsIn,
	IsOptional,
	IsArray,
	IsInt,
	Min,
	ArrayMaxSize,
	IsString,
	IsNumber,
	ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MESSAGES } from '../../common/messages';
import { PRODUCT_STATUSES } from '../../common/constants';
import { ProductStatus } from '../../common/enums/product-status.enum';

/**
 * @swagger
 * components:
 *   schemas:
 *     QuantityFilterDto:
 *       type: object
 *       description: Фильтр по количеству товара
 *       properties:
 *         gt:
 *           type: number
 *           description: Количество больше указанного
 *           example: 10
 *           minimum: 0
 *         lt:
 *           type: number
 *           description: Количество меньше указанного
 *           example: 50
 *           minimum: 0
 *         gte:
 *           type: number
 *           description: Количество больше или равно указанному
 *           example: 10
 *           minimum: 0
 *         lte:
 *           type: number
 *           description: Количество меньше или равно указанному
 *           example: 50
 *           minimum: 0
 *     ProductFilterDto:
 *       type: object
 *       description: DTO для фильтрации товаров
 *       properties:
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
 *           description: Статус товара (AVAILABLE — в наличии, OUT_OF_STOCK — отсутствует, DISCONTINUED — снят с производства)
 *           example: AVAILABLE
 *           nullable: true
 *         cityId:
 *           type: integer
 *           description: Идентификатор города для фильтрации
 *           example: 1
 *           minimum: 1
 *           nullable: true
 *         categoryIds:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 1
 *           description: Идентификаторы категорий для фильтрации
 *           example: [1, 2]
 *           nullable: true
 *         sortBy:
 *           type: string
 *           enum: [createdAt, name, price, quantity]
 *           description: Поле для сортировки
 *           example: price
 *           nullable: true
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 *           description: Порядок сортировки
 *           example: asc
 *           nullable: true
 */
export class QuantityFilterDto {
	@IsNumber({}, { message: MESSAGES.QUANTITY_INVALID_FORMAT })
	@Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
	@IsOptional()
	gt?: number;

	@IsNumber({}, { message: MESSAGES.QUANTITY_INVALID_FORMAT })
	@Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
	@IsOptional()
	lt?: number;

	@IsNumber({}, { message: MESSAGES.QUANTITY_INVALID_FORMAT })
	@Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
	@IsOptional()
	gte?: number;

	@IsNumber({}, { message: MESSAGES.QUANTITY_INVALID_FORMAT })
	@Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
	@IsOptional()
	lte?: number;
}

export class ProductFilterDto {
	@IsIn(PRODUCT_STATUSES, { message: MESSAGES.STATUS_INVALID_FORMAT })
	@IsOptional()
	status?: ProductStatus;

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
	@ArrayMaxSize(50, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE })
	@IsOptional()
	categoryIds?: number[];

	@IsString({ message: MESSAGES.NAME_INVALID_FORMAT })
	@IsOptional()
	name?: string;

	@IsNumber({}, { message: MESSAGES.PRICE_INVALID_FORMAT })
	@Min(0, { message: MESSAGES.PRICE_NEGATIVE })
	@IsOptional()
	minPrice?: number;

	@IsNumber({}, { message: MESSAGES.PRICE_INVALID_FORMAT })
	@Min(0, { message: MESSAGES.PRICE_NEGATIVE })
	@IsOptional()
	maxPrice?: number;

	@ValidateNested({ message: MESSAGES.QUANTITY_INVALID_FORMAT })
	@Type(() => QuantityFilterDto)
	@IsOptional()
	quantity?: QuantityFilterDto;

	@IsIn(['createdAt', 'name', 'price', 'quantity'], {
		message: MESSAGES.SORT_BY_INVALID_FORMAT,
	})
	@IsOptional()
	sortBy?: string;

	@IsIn(['asc', 'desc'], { message: MESSAGES.SORT_ORDER_INVALID_FORMAT })
	@IsOptional()
	sortOrder?: string;
}
