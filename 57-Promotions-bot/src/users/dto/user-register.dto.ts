import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { IsPassword } from './decorators/password.decorator';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegisterDto:
 *       type: object
 *       description: Данные для регистрации пользователя.
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Электронная почта пользователя. Уникальна.
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Пароль пользователя. Должен содержать буквы и цифры.
 *           example: Str0ngP@ssword
 *         name:
 *           type: string
 *           description: Имя пользователя.
 *           example: Иван Иванов
 */
export class UserRegisterDto {
	@IsEmail({}, { message: MESSAGES.INVALID_EMAIL })
	email!: string;

	@IsPassword({ message: MESSAGES.PASSWORD_COMPLEXITY })
	@IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Пароль') })
	password!: string;

	@IsString({ message: MESSAGES.INVALID_NAME })
	@IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Имя') })
	name!: string;
}
