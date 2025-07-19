import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserUpdateProfileDto } from './dto/user-update-profile.dto';
import {
	WarehouseManagerResponse,
	UserWithAddressAndCategories,
} from './users.repository.interface';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Role } from '../common/enums/role.enum';
import { UserFilterDto } from './dto/user-filter.dto';
import { ProductWithRelations } from '../products/products.repository.interface';

export interface IUsersService {
	createUser(dto: UserRegisterDto, role: Role): Promise<UserWithAddressAndCategories>;
	createTelegramUser(telegramId: string, name: string): Promise<UserWithAddressAndCategories>;
	getUserInfoByEmail(email: string): Promise<UserWithAddressAndCategories>;
	getUserInfoById(id: number): Promise<UserWithAddressAndCategories>;
	getUserInfoByTelegramId(telegramId: string): Promise<UserWithAddressAndCategories | null>;
	getAllWarehouseManagers({
		filters,
		pagination,
	}: {
		filters?: UserFilterDto;
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<WarehouseManagerResponse>>;
	getProductsForUser(
		telegramId: string,
		pagination: PaginationDto,
	): Promise<PaginatedResponse<ProductWithRelations>>;
	getUserAddresses(id: number): Promise<{ id: number; address: string; isDefault: boolean }[]>;
	updateWarehouseManagerPassword(
		id: number,
		newPassword: string,
		oldPassword: string,
	): Promise<UserWithAddressAndCategories>;
	updateUserTelegramId(id: number, telegramId: string): Promise<UserWithAddressAndCategories>;
	updateUserProfile(
		id: number,
		dto: UserUpdateProfileDto,
		currentUser: { id: number; role: Role },
	): Promise<UserWithAddressAndCategories>;
	updateUserCategories(id: number, categoryIds: number[]): Promise<UserWithAddressAndCategories>;
	deleteWarehouseManager(
		id: number,
		newResponsibleId?: number,
	): Promise<UserWithAddressAndCategories>;
	login(dto: UserLoginDto): Promise<string>;
}
