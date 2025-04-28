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
import { Prisma } from '@prisma/client';
import { MESSAGES } from '../common/messages';
import { PrismaService } from '../database/prisma.service';
import { sign } from 'jsonwebtoken';

@injectable()
export class UsersService implements IUsersService {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UsersRepository) private usersRepository: IUsersRepository,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
	) {}

	private handleError(err: unknown): never {
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
			throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
		}
		throw err instanceof HTTPError ? err : new HTTPError(500, MESSAGES.SERVER_ERROR);
	}

	private async createUser(
		dto: UserRegisterDto,
		role: 'ADMIN' | 'SUPPLIER',
	): Promise<UserModel> {
		const newUser = new User(dto.email, dto.name, role);
		const salt = this.configService.get('SALT');
		await newUser.setPassword(dto.password, Number(salt));
		const existedUser = await this.usersRepository.find(dto.email);
		if (existedUser) {
			throw new HTTPError(422, MESSAGES.USER_ALREADY_EXISTS);
		}
		return this.usersRepository.create(newUser);
	}

	async createAdmin(dto: UserRegisterDto): Promise<UserModel> {
		try {
			return await this.createUser(dto, 'ADMIN');
		} catch (err) {
			return this.handleError(err);
		}
	}

	async createSupplier(dto: UserRegisterDto): Promise<UserModel> {
		try {
			return await this.createUser(dto, 'SUPPLIER');
		} catch (err) {
			return this.handleError(err);
		}
	}

	async login(dto: UserLoginDto): Promise<string> {
		try {
			const result = await this.validateUser(dto);
			if (!result) {
				throw new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login');
			}
			const user = await this.getUserInfo(dto.email);
			if (!user) {
				throw new HTTPError(401, MESSAGES.USER_NOT_FOUND, 'login');
			}
			return this.signJWT(user.email, user.role);
		} catch (err) {
			throw this.handleError(err);
		}
	}

	async validateUser({ email, password }: UserLoginDto): Promise<boolean> {
		try {
			const existedUser = await this.usersRepository.find(email);
			if (!existedUser) {
				return false;
			}
			const newUser = new User(
				existedUser.email,
				existedUser.name,
				existedUser.role,
				existedUser.password,
			);
			return newUser.comparePassword(password);
		} catch (err) {
			return this.handleError(err);
		}
	}

	async getUserInfo(email: string): Promise<UserModel | null> {
		try {
			return await this.usersRepository.find(email);
		} catch (err) {
			return this.handleError(err);
		}
	}

	async getUserInfoById(id: number): Promise<UserModel | null> {
		try {
			return await this.usersRepository.findById(id);
		} catch (err) {
			return this.handleError(err);
		}
	}

	async getAllSuppliers(): Promise<SupplierResponse[]> {
		try {
			return await this.usersRepository.findAllSuppliers();
		} catch (err) {
			return this.handleError(err);
		}
	}

	async updateSupplierPassword(id: number, newPassword: string): Promise<UserModel> {
		try {
			if (isNaN(id)) {
				throw new HTTPError(400, MESSAGES.INVALID_FORMAT);
			}
			const user = await this.usersRepository.findById(id);
			if (!user || user.role !== 'SUPPLIER') {
				throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
			}
			const newUser = new User(user.email, user.name, user.role, user.password);
			const salt = this.configService.get('SALT');
			await newUser.setPassword(newPassword, Number(salt));
			const updatedUser = await this.usersRepository.update(id, { password: newUser.password });
			if (!updatedUser) {
				throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
			}
			return updatedUser;
		} catch (err) {
			return this.handleError(err);
		}
	}

	async deleteSupplier(id: number): Promise<UserModel> {
		try {
			if (isNaN(id)) {
				throw new HTTPError(400, MESSAGES.INVALID_FORMAT);
			}
			const user = await this.usersRepository.findById(id);
			if (!user || user.role !== 'SUPPLIER') {
				throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
			}

			const activePromotions = await this.prismaService.client.promotionModel.findMany({
				where: {
					supplierId: id,
					endDate: { gte: new Date() },
				},
			});
			if (activePromotions.length > 0) {
				throw new HTTPError(400, MESSAGES.SUPPLIER_HAS_ACTIVE_PROMOTIONS);
			}

			const deletedUser = await this.usersRepository.delete(id);
			if (!deletedUser) {
				throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
			}
			return deletedUser;
		} catch (err) {
			return this.handleError(err);
		}
	}

	private signJWT(email: string, role: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			sign(
				{
					email,
					role,
					iat: Math.floor(Date.now() / 1000),
				},
				this.configService.get('SECRET'),
				{
					algorithm: 'HS256',
				},
				(err, token) => {
					if (err) {
						reject(err);
					}
					resolve(token as string);
				},
			);
		});
	}
}
