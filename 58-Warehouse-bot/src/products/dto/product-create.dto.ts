import {
	IsString,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	MaxLength,
	IsArray,
	IsInt,
	Min,
	ArrayMinSize,
	ArrayMaxSize,
	IsIn,
	ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MESSAGES } from '../../common/messages';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { PRODUCT_STATUSES } from '../../common/constants';

export class ProductOptionDto {
	@IsString({ message: MESSAGES.NAME_INVALID_FORMAT })
	@MaxLength(100, { message: MESSAGES.NAME_INVALID_LENGTH })
	@IsNotEmpty({ message: MESSAGES.NAME_REQUIRED_FIELD })
	name!: string;

	@IsString({ message: MESSAGES.VALUE_INVALID_FORMAT })
	@MaxLength(100, { message: MESSAGES.VALUE_INVALID_LENGTH })
	@IsNotEmpty({ message: MESSAGES.VALUE_REQUIRED_FIELD })
	value!: string;

	@IsNumber({}, { message: MESSAGES.PRICE_INVALID_FORMAT })
	@IsOptional()
	priceModifier: number = 0;
}

export class ProductCreateDto {
	@IsString({ message: MESSAGES.NAME_INVALID_FORMAT })
	@MaxLength(200, { message: MESSAGES.NAME_INVALID_LENGTH })
	@IsNotEmpty({ message: MESSAGES.NAME_REQUIRED_FIELD })
	name!: string;

	@IsString({ message: MESSAGES.DESCRIPTION_INVALID_FORMAT })
	@MaxLength(1000, { message: MESSAGES.DESCRIPTION_INVALID_LENGTH })
	@IsOptional()
	description?: string;

	@IsNumber({}, { message: MESSAGES.PRICE_INVALID_FORMAT })
	@Min(0, { message: MESSAGES.PRICE_NEGATIVE })
	@IsNotEmpty({ message: MESSAGES.PRICE_REQUIRED_FIELD })
	price!: number;

	@IsInt({ message: MESSAGES.QUANTITY_INVALID_FORMAT })
	@Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
	@IsNotEmpty({ message: MESSAGES.QUANTITY_REQUIRED_FIELD })
	quantity!: number;

	@IsString({ message: MESSAGES.SKU_INVALID_FORMAT })
	@IsNotEmpty({ message: MESSAGES.SKU_REQUIRED_FIELD })
	sku!: string;

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
	@Min(1, { each: true, message: MESSAGES.CATEGORY_IDS_INVALID_INTEGER })
	@ArrayMinSize(1, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE_MIN })
	@ArrayMaxSize(50, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE })
	@IsOptional()
	categoryIds?: number[];

	@IsArray({ message: MESSAGES.OPTIONS_INVALID_ARRAY })
	@ValidateNested({ each: true })
	@Type(() => ProductOptionDto)
	@IsOptional()
	options?: ProductOptionDto[];

	@IsIn(PRODUCT_STATUSES, { message: MESSAGES.STATUS_INVALID_FORMAT })
	@IsOptional()
	status?: ProductStatus;
}
