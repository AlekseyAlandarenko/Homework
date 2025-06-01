import { IsNotEmpty } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { IsPassword } from './decorators/password.decorator';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserUpdatePasswordDto:
 *       type: object
 *       description: Данные для обновления пароля пользователя.
 *       required:
 *         - newPassword
 *       properties:
 *         newPassword:
 *           type: string
 *           format: password
 *           description: Новый пароль пользователя. Должен содержать буквы и цифры.
 *           example: NewP@ssword123
 */
export class UserUpdatePasswordDto {
	@IsPassword({ message: MESSAGES.PASSWORD_COMPLEXITY })
	@IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Новый пароль') })
	newPassword!: string;
}
