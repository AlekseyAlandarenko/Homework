/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegisterDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: Str0ngP@ssword
 *         name:
 *           type: string
 *           example: Иван Иванов
 *         role:
 *           type: string
 *           enum: [admin, supplier]
 *           example: supplier
 */
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