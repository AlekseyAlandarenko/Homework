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
	ValidateNested,
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MESSAGES } from '../../common/messages';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { PRODUCT_STATUSES } from '../../common/constants';
import { ProductOptionDto } from './product-create.dto';

@ValidatorConstraint({ name: 'nonEmptyObject', async: false })
class NonEmptyObjectValidator implements ValidatorConstraintInterface {
	validate(_value: unknown, args: ValidationArguments): boolean {
		const obj = args.object as Record<string, unknown>;

		return Object.keys(obj).some((key) => {
			const value = obj[key];

			if (value === undefined || value === null) {
				return false;
			}

			if (typeof value === 'string') {
				return value.trim().length > 0;
			}

			if (typeof value === 'number') {
				return !isNaN(value);
			}

			if (typeof value === 'boolean') {
				return true;
			}

			if (Array.isArray(value)) {
				return value.length > 0;
			}

			return false;
		});
	}

	defaultMessage(): string {
		return MESSAGES.VALIDATION_ERROR;
	}
}

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

	@IsArray({ message: MESSAGES.OPTIONS_INVALID_ARRAY })
	@ValidateNested({ each: true })
	@Type(() => ProductOptionDto)
	@IsOptional()
	options?: ProductOptionDto[];

	@IsIn(PRODUCT_STATUSES, { message: MESSAGES.STATUS_INVALID_FORMAT })
	@IsOptional()
	status?: ProductStatus;

	@Validate(NonEmptyObjectValidator, [], {
		message: MESSAGES.NON_EMPTY_OBJECT_VALIDATION_FAILED,
	})
	private nonEmptyValidation?: boolean;
}
