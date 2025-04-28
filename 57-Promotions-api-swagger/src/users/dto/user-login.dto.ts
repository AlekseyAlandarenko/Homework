/**
 * @swagger
 * components:
 *   schemas:
 *     UserLoginDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 */
import { IsString } from 'class-validator';
import { MESSAGES } from '../../common/messages';

export class UserLoginDto {
  @IsString({ message: MESSAGES.INVALID_EMAIL })
  email!: string;

  @IsString({ message: MESSAGES.INVALID_PASSWORD })
  password!: string;
}