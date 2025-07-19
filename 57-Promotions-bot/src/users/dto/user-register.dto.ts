import {
	IsEmail,
	IsString,
	IsNotEmpty,
	IsOptional,
	IsArray,
	MinLength,
	MaxLength,
	Matches,
	IsInt,
	Min,
	ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MESSAGES } from '../../common/messages';

export class UserRegisterDto {
	@IsEmail({}, { message: MESSAGES.EMAIL_INVALID_EMAIL_FORMAT })
	@MaxLength(255, { message: MESSAGES.EMAIL_INVALID_LENGTH })
	@IsNotEmpty({ message: MESSAGES.EMAIL_REQUIRED_FIELD })
	@Transform(({ value }) => value.trim())
	email!: string;

	@IsString({ message: MESSAGES.PASSWORD_INVALID_FORMAT })
	@MinLength(8, { message: MESSAGES.PASSWORD_COMPLEXITY })
	@Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
		message: MESSAGES.PASSWORD_COMPLEXITY,
	})
	@IsNotEmpty({ message: MESSAGES.PASSWORD_REQUIRED_FIELD })
	password!: string;

	@IsString({ message: MESSAGES.NAME_INVALID_FORMAT })
	@MaxLength(100, { message: MESSAGES.NAME_INVALID_NAME_LENGTH })
	@Matches(/^[A-Za-zА-Яа-яёЁ\s-]+$/, {
		message: MESSAGES.NAME_INVALID_NAME_FORMAT,
	})
	@IsNotEmpty({ message: MESSAGES.NAME_REQUIRED_FIELD })
	@Transform(({ value }) => value.trim())
	name!: string;

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
	@ArrayMaxSize(50, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE })
	@IsOptional()
	categoryIds?: number[];
}
