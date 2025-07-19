import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserUpdateProfileDto } from './dto/user-update-profile.dto';
import { SupplierResponse, UserWithCategories } from './users.repository.interface';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PromotionWithRelations } from '../promotions/promotions.repository.interface';
import { Role } from '../common/enums/role.enum';
import { UserFilterDto } from './dto/user-filter.dto';

export interface IUsersService {
	createUser(dto: UserRegisterDto, role: Role): Promise<UserWithCategories>;
	createTelegramUser(telegramId: string, name: string): Promise<UserWithCategories>;
	getUserInfoByEmail(email: string): Promise<UserWithCategories>;
	getUserInfoById(id: number): Promise<UserWithCategories>;
	getUserInfoByTelegramId(telegramId: string): Promise<UserWithCategories | null>;
	getAllSuppliers({
		filters,
		pagination,
	}: {
		filters?: UserFilterDto & { categoryIds?: number[] };
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<SupplierResponse>>;
	getPromotionsForUser(
		telegramId: string,
		pagination: PaginationDto,
	): Promise<PaginatedResponse<PromotionWithRelations>>;
	updateSupplierPassword(
		id: number,
		newPassword: string,
		oldPassword: string,
	): Promise<UserWithCategories>;
	updateUserTelegramId(id: number, telegramId: string): Promise<UserWithCategories>;
	updateUserProfile(
		id: number,
		dto: UserUpdateProfileDto,
		currentUser: { id: number; role: Role },
	): Promise<UserWithCategories>;
	updateUserCategories(id: number, categoryIds: number[]): Promise<UserWithCategories>;
	deleteSupplier(id: number): Promise<UserWithCategories>;
	login(dto: UserLoginDto): Promise<string>;
}
