import { IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { IsPassword } from './decorators/password.decorator';

export enum UserRole {
  ADMIN = 'admin',
  SUPPLIER = 'supplier',
}

export class UserRegisterDto {
  @IsEmail({}, { message: MESSAGES.INVALID_EMAIL })
  email!: string;

  @IsPassword({ message: MESSAGES.PASSWORD_COMPLEXITY })
  @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Пароль') })
  password!: string;

  @IsString({ message: MESSAGES.INVALID_NAME })
  @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Имя') })
  name!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: MESSAGES.INVALID_ROLE })
  role?: UserRole;
}