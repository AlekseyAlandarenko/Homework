import {
	IsString,
	IsDateString,
	IsOptional,
	MaxLength,
	IsArray,
	IsInt,
	Min,
	ArrayMinSize,
	ArrayMaxSize,
	Validate,
	IsUrl,
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsEndDateAfterStartDate } from './validators/end-date-after-start-date.validator';
import { MESSAGES } from '../../common/messages';

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

export class PromotionUpdateDto {
	@IsString({ message: MESSAGES.TITLE_INVALID_FORMAT })
	@MaxLength(200, { message: MESSAGES.TITLE_INVALID_LENGTH })
	@IsOptional()
	title?: string;

	@IsString({ message: MESSAGES.DESCRIPTION_INVALID_FORMAT })
	@MaxLength(1000, { message: MESSAGES.DESCRIPTION_INVALID_LENGTH })
	@IsOptional()
	description?: string;

	@IsDateString({}, { message: MESSAGES.START_DATE_INVALID_DATE_FORMAT })
	@IsOptional()
	startDate?: string;

	@IsDateString({}, { message: MESSAGES.END_DATE_INVALID_DATE_FORMAT })
	@IsEndDateAfterStartDate({ message: MESSAGES.END_DATE_INVALID_DATES })
	@IsOptional()
	endDate?: string;

	@IsDateString({}, { message: MESSAGES.PUBLICATION_DATE_INVALID_FORMAT })
	@IsOptional()
	publicationDate?: string;

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

	@IsUrl({}, { message: MESSAGES.INVALID_URL })
	@IsOptional()
	imageUrl?: string;

	@IsUrl({}, { message: MESSAGES.INVALID_URL })
	@IsOptional()
	linkUrl?: string;

	@Validate(NonEmptyObjectValidator, [], {
		message: MESSAGES.NON_EMPTY_OBJECT_VALIDATION_FAILED,
	})
	private nonEmptyValidation?: boolean;
}
