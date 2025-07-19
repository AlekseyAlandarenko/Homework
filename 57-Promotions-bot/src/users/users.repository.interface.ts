import { UserModel, Prisma } from '@prisma/client';
import { User } from './user.entity';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Role } from '../common/enums/role.enum';

export type UserWithCategories = UserModel & {
	city: { id: number; name: string } | null;
	preferredCategories: { id: number; name: string }[];
};

export type SupplierResponse = Omit<UserModel, 'password'> & {
	cityId: number | null;
	city: { id: number; name: string } | null;
	preferredCategories: { id: number; name: string }[];
};

export interface IUsersRepository {
	userInclude: Prisma.UserModelInclude;
	createUser(user: User): Promise<UserWithCategories>;
	findUserByKey(
		key: Extract<keyof UserWithCategories, 'email' | 'telegramId' | 'id'>,
		value: string | number,
		userId?: number,
		includeDeleted?: boolean,
	): Promise<UserWithCategories | null>;
	findUserByKeyOrThrow(
		key: Extract<keyof UserWithCategories, 'email' | 'telegramId' | 'id'>,
		value: string | number,
	): Promise<UserWithCategories>;
	findAllUsers({
		role,
		filters,
		pagination,
		orderBy,
		includeDeleted,
	}: {
		role?: Role;
		filters?: Prisma.UserModelWhereInput;
		pagination?: PaginationDto;
		orderBy?: Prisma.UserModelOrderByWithRelationInput;
		includeDeleted?: boolean;
	}): Promise<PaginatedResponse<SupplierResponse>>;
	updateUser(id: number, data: Prisma.UserModelUpdateInput): Promise<UserWithCategories>;
	updateUserCity(id: number, cityId: number): Promise<UserWithCategories>;
	updateUserCategories(id: number, categoryData: { id: number }[]): Promise<UserWithCategories>;
	deleteUser(id: number): Promise<UserWithCategories>;
}
