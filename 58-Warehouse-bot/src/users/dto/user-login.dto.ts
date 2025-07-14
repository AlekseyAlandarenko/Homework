import { IsEmail, IsString, MinLength, Matches, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLoginDto:
 *       type: object
 *       description: DTO для аутентификации пользователя.
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Электронная почта пользователя.
 *           example: user@example.com
 *           maxLength: 255
 *         password:
 *           type: string
 *           description: Пароль пользователя (минимум 8 символов, должен содержать буквы и цифры).
 *           example: Password123
 *           minLength: 8
 *       required:
 *         - email
 *         - password
 */
export class UserLoginDto {
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
}