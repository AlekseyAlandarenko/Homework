import { inject, injectable } from 'inversify';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { User } from './user.entity';
import { IUsersService } from './users.service.interface';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { IUsersRepository, SupplierResponse } from './users.repository.interface';
import { UserModel } from '@prisma/client';
import { HTTPError } from '../errors/http-error.class';
import { PrismaService } from '../database/prisma.service';
import { sign } from 'jsonwebtoken';
import { UserRole } from '../common/constants';
import { PaginatedResponse, DEFAULT_PAGINATION } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MESSAGES } from '../common/messages';
import { validateId } from '../common/validators';

@injectable()
export class UsersService implements IUsersService {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UsersRepository) private usersRepository: IUsersRepository,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
	) {}

	async createUser(dto: UserRegisterDto, role: UserRole): Promise<UserModel> {
		const existedUser = await this.usersRepository.findByEmail(dto.email);
		if (existedUser) {
			throw new HTTPError(422, MESSAGES.USER_ALREADY_EXISTS);
		}

		const newUser = new User(dto.email, dto.name, role);
		const salt = this.configService.get('SALT');
		await newUser.setPassword(dto.password, Number(salt));
		return this.usersRepository.createUser(newUser);
	}

	async login(dto: UserLoginDto): Promise<string> {
		const user = await this.usersRepository.findByEmail(dto.email);
		if (!user) {
			throw new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login');
		}
		const newUser = new User(user.email, user.name, user.role as UserRole, user.password);
		const isValid = await newUser.comparePassword(dto.password);
		if (!isValid) {
			throw new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login');
		}
		return this.signJWT(user.id, user.email, user.role);
	}

	async getUserInfoByEmail(email: string): Promise<UserModel> {
		return this.usersRepository.findByEmailOrThrow(email);
	}

	async getUserInfoById(id: number): Promise<UserModel> {
		validateId(id);
		return this.usersRepository.findByIdOrThrow(id);
	}

	async getAllSuppliers(
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<SupplierResponse>> {
		return this.usersRepository.findAllSuppliers(pagination);
	}

	async updateSupplierPassword(id: number, newPassword: string): Promise<UserModel> {
		validateId(id);
		const user = await this.usersRepository.findByIdOrThrow(id);
		if (user.role !== 'SUPPLIER') {
			throw new HTTPError(403, MESSAGES.INVALID_ROLE.replace('{{role}}', user.role));
		}

		const newUser = new User(user.email, user.name, user.role as UserRole, user.password);
		const salt = this.configService.get('SALT');
		await newUser.setPassword(newPassword, Number(salt));
		return this.usersRepository.updateUser(id, { password: newUser.password });
	}

	async deleteSupplier(id: number): Promise<UserModel> {
		validateId(id);
		const user = await this.usersRepository.findByIdOrThrow(id);
		if (user.role !== 'SUPPLIER') {
			throw new HTTPError(403, MESSAGES.INVALID_ROLE.replace('{{role}}', user.role));
		}

		const activePromotionsCount = await this.prismaService.client.promotionModel.count({
			where: {
				supplierId: id,
				status: 'APPROVED',
				endDate: { gte: new Date() },
			},
		});
		if (activePromotionsCount > 0) {
			throw new HTTPError(400, MESSAGES.SUPPLIER_HAS_ACTIVE_PROMOTIONS);
		}

		return this.usersRepository.deleteUser(id);
	}

	private signJWT(id: number, email: string, role: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			sign(
				{ id, email, role, iat: Math.floor(Date.now() / 1000) },
				this.configService.get('SECRET'),
				{ algorithm: 'HS256' },
				(err, token) => {
					if (err) reject(err);
					resolve(token as string);
				},
			);
		});
	}
}
