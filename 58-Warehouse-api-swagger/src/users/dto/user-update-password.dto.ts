import { IsNotEmpty } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { IsPassword } from './decorators/password.decorator';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserUpdatePasswordDto:
 *       type: object
 *       required:
 *         - newPassword
 *       properties:
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: NewP@ssword123
 */
export class UserUpdatePasswordDto {
  @IsPassword({ message: MESSAGES.NEW_PASSWORD_COMPLEXITY })
  @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Новый пароль') })
  newPassword!: string;
}