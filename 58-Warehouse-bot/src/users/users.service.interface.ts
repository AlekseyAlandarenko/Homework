import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserModel } from '@prisma/client';
import { WarehouseManagerResponse } from './users.repository.interface';
import { PaginatedResponse } from '../common/pagination.interface';
import { UserRole } from '../common/constants';
import { PaginationDto } from '../common/dto/pagination.dto';

export interface IUsersService {
	createUser(dto: UserRegisterDto, role: UserRole): Promise<UserModel>;
	login(dto: UserLoginDto): Promise<string>;
	getUserInfoByEmail(email: string): Promise<UserModel>;
	getUserInfoById(id: number): Promise<UserModel>;
	getAllWarehouseManagers(
		params?: PaginationDto,
	): Promise<PaginatedResponse<WarehouseManagerResponse>>;
	findByTelegramId(telegramId: string): Promise<UserModel | null>;
	updateWarehouseManagerPassword(id: number, newPassword: string): Promise<UserModel>;
	updateTelegramId(id: number, telegramId: string): Promise<UserModel>;
	deleteWarehouseManager(id: number): Promise<UserModel>;
}
