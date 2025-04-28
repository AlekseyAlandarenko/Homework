import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserModel } from '@prisma/client';
import { WarehouseManagerResponse } from './users.repository.interface';

export interface IUsersService {
	createAdmin(dto: UserRegisterDto): Promise<UserModel>;
	createWarehouseManager(dto: UserRegisterDto): Promise<UserModel>;
	login(dto: UserLoginDto): Promise<string>;
	validateUser(dto: UserLoginDto): Promise<boolean>;
	getUserInfo(email: string): Promise<UserModel | null>;
	getUserInfoById(id: number): Promise<UserModel | null>;
	getAllWarehouseManagers(params?: { page?: number; limit?: number }): Promise<{
		items: WarehouseManagerResponse[];
		total: number;
	  }>;
	updateWarehouseManagerPassword(id: number, newPassword: string): Promise<UserModel>;
	deleteWarehouseManager(id: number): Promise<UserModel>;
}
