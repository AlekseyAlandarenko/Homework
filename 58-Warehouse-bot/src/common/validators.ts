import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from './messages';
import { IUsersService } from '../users/users.service.interface';
import { UserModel } from '@prisma/client';

export async function validateUserExists(
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

export function validateQuantity(quantity: number): void {
	if (quantity < 0) {
		throw new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE);
	}
}

export function validatePurchaseQuantity(available: number, requested: number): void {
	if (available === 0) {
		throw new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK);
	}
	if (available < requested) {
		throw new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
	}
}
