import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserModel } from '@prisma/client';
import { SupplierResponse } from './users.repository.interface';

export interface IUsersService {
	createAdmin(dto: UserRegisterDto): Promise<UserModel>;
	createSupplier(dto: UserRegisterDto): Promise<UserModel>;
	login(dto: UserLoginDto): Promise<string>;
	validateUser(dto: UserLoginDto): Promise<boolean>;
	getUserInfo(email: string): Promise<UserModel | null>;
	getUserInfoById(id: number): Promise<UserModel | null>;
	getAllSuppliers(): Promise<SupplierResponse[]>;
	updateSupplierPassword(id: number, newPassword: string): Promise<UserModel>;
	deleteSupplier(id: number): Promise<UserModel>;
}
