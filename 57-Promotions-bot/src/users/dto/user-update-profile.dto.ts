import {
	IsArray,
	IsInt,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	ArrayMaxSize,
	Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MESSAGES } from '../../common/messages';

export class UserUpdateProfileDto {
	@IsString({ message: MESSAGES.NAME_INVALID_FORMAT })
	@MaxLength(100, { message: MESSAGES.NAME_INVALID_NAME_LENGTH })
	@Matches(/^[A-Za-zА-Яа-яёЁ\s-]+$/, {
		message: MESSAGES.NAME_INVALID_NAME_FORMAT,
	})
	@Transform(({ value }) => value.trim())
	@IsOptional()
	name?: string;

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
	@IsInt({ each: true, message: MESSAGES.CITY_ID_INVALID_INTEGER })
	@Min(1, { each: true, message: MESSAGES.CITY_ID_INVALID_INTEGER })
	@ArrayMaxSize(50, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE })
	@IsOptional()
	categoryIds?: number[];
}
