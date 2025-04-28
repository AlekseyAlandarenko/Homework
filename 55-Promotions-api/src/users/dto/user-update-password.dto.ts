import { IsNotEmpty } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { IsPassword } from './decorators/password.decorator';

export class UserUpdatePasswordDto {
  @IsPassword({ message: MESSAGES.NEW_PASSWORD_COMPLEXITY })
  @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Новый пароль') })
  newPassword!: string;
}