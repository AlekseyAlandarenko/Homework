import { UserModel, Prisma } from '@prisma/client';
import { User } from './user.entity';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Role } from '../common/enums/role.enum';

export type UserWithAddressAndCategories = UserModel & {
	city: { id: number; name: string } | null;
	preferredCategories: { id: number; name: string }[];
	addresses: { id: number; address: string; isDefault: boolean }[];
};

export type WarehouseManagerResponse = Omit<UserModel, 'password'> & {
	cityId: number | null;
	city: { id: number; name: string } | null;
	preferredCategories: { id: number; name: string }[];
	addresses: { id: number; address: string; isDefault: boolean }[];
};

export interface IUsersRepository {
	userInclude: Prisma.UserModelInclude;
	createUser(user: User): Promise<UserWithAddressAndCategories>;
	findUserByKey(
		key: Extract<keyof UserWithAddressAndCategories, 'email' | 'telegramId' | 'id'>,
		value: string | number,
		userId?: number,
		includeDeleted?: boolean,
	): Promise<UserWithAddressAndCategories | null>;
	findUserByKeyOrThrow(
		key: Extract<keyof UserWithAddressAndCategories, 'email' | 'telegramId' | 'id'>,
		value: string | number,
	): Promise<UserWithAddressAndCategories>;
	findAllUsers({
		role,
		filters,
		pagination,
		orderBy,
	}: {
		role?: Role;
		filters?: Prisma.UserModelWhereInput;
		pagination?: PaginationDto;
		orderBy?: Prisma.UserModelOrderByWithRelationInput;
	}): Promise<PaginatedResponse<WarehouseManagerResponse>>;
	updateUser(id: number, data: Partial<UserModel>): Promise<UserWithAddressAndCategories>;
	updateUserCity(id: number, cityId: number): Promise<UserWithAddressAndCategories>;
	updateUserCategories(
		id: number,
		categoryData: { id: number }[],
	): Promise<UserWithAddressAndCategories>;
	deleteUser(id: number): Promise<UserWithAddressAndCategories>;
}
