import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from './messages';
import { IUsersService } from '../users/users.service.interface';
import { UserModel } from '@prisma/client';

export async function checkUserExists(
	email: string | undefined,
	usersService: IUsersService,
): Promise<UserModel> {
	if (!email) {
		throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
	}
	return usersService.getUserInfoByEmail(email);
}

export function validateId(id: number): void {
	if (isNaN(id) || id <= 0) {
		throw new HTTPError(422, MESSAGES.INVALID_ID);
	}
}
