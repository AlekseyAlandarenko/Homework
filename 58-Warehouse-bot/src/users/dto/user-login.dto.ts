import { IsEmail, IsString } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLoginDto:
 *       type: object
 *       description: Данные для аутентификации пользователя.
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Электронная почта пользователя.
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Пароль пользователя.
 *           example: password123
 */
export class UserLoginDto {
	@IsEmail({}, { message: MESSAGES.INVALID_EMAIL })
	email!: string;

	@IsString({ message: MESSAGES.INVALID_PASSWORD })
	password!: string;
}
