import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { Transform } from 'class-transformer';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserUpdatePasswordDto:
 *       type: object
 *       description: DTO для обновления пароля пользователя.
 *       properties:
 *         newPassword:
 *           type: string
 *           description: Новый пароль пользователя (минимум 8 символов, должен содержать буквы и цифры).
 *           example: NewPassword123
 *           minLength: 8
 *         oldPassword:
 *           type: string
 *           description: Текущий пароль пользователя для подтверждения.
 *           example: OldPassword123
 *           minLength: 8
 *       required:
 *         - newPassword
 *         - oldPassword
 */
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
