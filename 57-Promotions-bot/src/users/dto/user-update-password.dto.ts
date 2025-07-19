import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { Transform } from 'class-transformer';

export class UserUpdatePasswordDto {
	@IsString({ message: MESSAGES.NEW_PASSWORD_INVALID_FORMAT })
	@MinLength(8, { message: MESSAGES.NEW_PASSWORD_COMPLEXITY })
	@Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
		message: MESSAGES.NEW_PASSWORD_COMPLEXITY,
	})
	@Transform(({ value }) => value.trim())
	@IsNotEmpty({ message: MESSAGES.NEW_PASSWORD_REQUIRED_FIELD })
	newPassword!: string;

	@IsString({ message: MESSAGES.PASSWORD_INVALID_FORMAT })
	@MinLength(8, { message: MESSAGES.PASSWORD_COMPLEXITY })
	@Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
		message: MESSAGES.PASSWORD_COMPLEXITY,
	})
	@Transform(({ value }) => value.trim())
	@IsNotEmpty({ message: MESSAGES.PASSWORD_REQUIRED_FIELD })
	oldPassword!: string;
}
