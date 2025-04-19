import { IsString } from 'class-validator';
import { MESSAGES } from '../../common/messages';

export class UserLoginDto {
	@IsString({ message: MESSAGES.INVALID_EMAIL })
	email!: string;

	@IsString({ message: MESSAGES.INVALID_PASSWORD })
	password!: string;
}