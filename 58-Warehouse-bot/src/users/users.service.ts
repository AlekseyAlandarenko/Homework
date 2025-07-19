import { inject, injectable } from 'inversify';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserUpdateProfileDto } from './dto/user-update-profile.dto';
import { User } from './user.entity';
import { IUsersService } from './users.service.interface';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import {
	IUsersRepository,
	WarehouseManagerResponse,
	UserWithAddressAndCategories,
} from './users.repository.interface';
import {
	IProductsRepository,
	ProductWithRelations,
} from '../products/products.repository.interface';
import { HTTPError } from '../errors/http-error.class';
import { sign } from 'jsonwebtoken';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MESSAGES } from '../common/messages';
import { UserModel, Prisma } from '@prisma/client';
import { DEFAULT_PAGINATION } from '../common/constants';
import { Role } from '../common/enums/role.enum';
import { ProductStatus } from '../common/enums/product-status.enum';
import { UserFilterDto } from './dto/user-filter.dto';
import { randomBytes } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';

@injectable()
export class UsersService implements IUsersService {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UsersRepository) private usersRepository: IUsersRepository,
		@inject(TYPES.ProductsRepository) private productsRepository: IProductsRepository,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
	) {}

	private async createUserEntity(user: Partial<UserWithAddressAndCategories>): Promise<User> {
		return new User(
			user.email || '',
			user.name || '',
			(user.role as Role) || Role.WAREHOUSE_MANAGER,
			user.password || '',
			user.telegramId,
			user.cityId,
			user.preferredCategories?.map((c) => c.id) || [],
			user.id,
		);
	}

	private async hashPassword(password: string): Promise<string> {
		const salt = Number(this.configService.get('SALT'));
		return hash(password, salt);
	}

	private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
		return compare(password, hashedPassword);
	}

	private async signJWT(id: number, email: string, role: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			sign(
				{ id, email, role, iat: Math.floor(Date.now() / 1000) },
				this.configService.get('SECRET'),
				{ algorithm: 'HS256' },
				(err, token) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(token!);
				},
			);
		});
	}

	private validateTelegramId(telegramId: string | undefined): string {
		if (!telegramId || !/^\d+$/.test(telegramId)) {
			throw new HTTPError(400, MESSAGES.TELEGRAM_ID_NOT_FOUND);
		}
		return telegramId;
	}

	async createUser(dto: UserRegisterDto, role: Role): Promise<UserWithAddressAndCategories> {
		const existingUser = await this.usersRepository.findUserByKey('email', dto.email);
		if (existingUser) {
			throw new HTTPError(409, MESSAGES.EMAIL_ALREADY_EXISTS);
		}

		const hashedPassword = await this.hashPassword(dto.password);
		if (dto.cityId) {
			await this.prismaService.validateCity(dto.cityId);
		}
		if (dto.categoryIds?.length) {
			await this.prismaService.validateCategories(dto.categoryIds);
		}

		const newUser = await this.createUserEntity({
			email: dto.email,
			name: dto.name,
			role,
			password: hashedPassword,
			telegramId: null,
			cityId: dto.cityId || null,
			preferredCategories: (dto.categoryIds || []).map((id) => ({ id, name: '' })),
			id: undefined,
		});

		const createdUser = await this.usersRepository.createUser(newUser);

		if (dto.addresses?.length) {
			const defaultAddresses = dto.addresses.filter((a) => a.isDefault);
			if (defaultAddresses.length > 1) {
				throw new HTTPError(400, MESSAGES.MULTIPLE_DEFAULT_ADDRESS);
			}

			await this.prismaService.deleteUserAddresses(createdUser.id);

			await this.prismaService.createAddresses(
				createdUser.id,
				dto.addresses.map((a) => ({
					address: a.address,
					isDefault: a.isDefault,
				})),
			);
		}

		return this.usersRepository.findUserByKeyOrThrow('id', createdUser.id);
	}

	async createTelegramUser(
		telegramId: string,
		name: string,
	): Promise<UserWithAddressAndCategories> {
		this.validateTelegramId(telegramId);
		const nameRegex = /^[a-zA-Zа-яА-Я0-9\s]+$/;
		const validatedName =
			!name || name.trim().length === 0 || name.length > 100 || !nameRegex.test(name)
				? 'Пользователь'
				: name;
		const email = `telegram_${telegramId}@example.com`;
		const tempPassword = randomBytes(8).toString('hex');
		const hashedPassword = await this.hashPassword(tempPassword);

		const newUser = await this.createUserEntity({
			email,
			name: validatedName,
			role: Role.WAREHOUSE_MANAGER,
			password: hashedPassword,
			telegramId,
			cityId: null,
			preferredCategories: [],
			id: undefined,
		});

		try {
			return await this.usersRepository.createUser(newUser);
		} catch (error) {
			if (error instanceof HTTPError && error.statusCode === 409) {
				const existingUser = await this.usersRepository.findUserByKey('telegramId', telegramId);
				if (!existingUser) {
					throw new HTTPError(500, MESSAGES.USER_NOT_FOUND_AFTER_UNIQUE_CONSTRAINT);
				}
				return existingUser;
			}
			throw error;
		}
	}

	async getUserInfoByEmail(email: string): Promise<UserWithAddressAndCategories> {
		return this.usersRepository.findUserByKeyOrThrow('email', email);
	}

	async getUserInfoById(id: number): Promise<UserWithAddressAndCategories> {
		return this.usersRepository.findUserByKeyOrThrow('id', id);
	}

	async getUserInfoByTelegramId(telegramId: string): Promise<UserWithAddressAndCategories | null> {
		this.validateTelegramId(telegramId);
		return this.usersRepository.findUserByKey('telegramId', telegramId);
	}

	async getAllWarehouseManagers({
		filters = {},
		pagination = DEFAULT_PAGINATION,
	}: {
		filters?: UserFilterDto & { categoryIds?: number[] };
		pagination?: PaginationDto;
	} = {}): Promise<PaginatedResponse<WarehouseManagerResponse>> {
		const prismaFilters: Prisma.UserModelWhereInput = {
			role: Role.WAREHOUSE_MANAGER,
			isDeleted: false,
		};

		if (filters.cityId) {
			prismaFilters.cityId = filters.cityId;
			await this.prismaService.validateCity(filters.cityId);
		}

		if (filters.hasProducts === true) {
			prismaFilters.createdProducts = {
				some: {
					isDeleted: false,
					isActive: true,
				},
			};
		} else if (filters.hasProducts === false) {
			prismaFilters.createdProducts = {
				none: {
					isDeleted: false,
					isActive: true,
				},
			};
		}

		if (filters.hasAddresses === true) {
			prismaFilters.addresses = {
				some: {
					isDeleted: false,
				},
			};
		} else if (filters.hasAddresses === false) {
			prismaFilters.addresses = {
				none: {
					isDeleted: false,
				},
			};
		}

		if (filters.categoryIds?.length) {
			await this.prismaService.validateCategories(filters.categoryIds);
			prismaFilters.preferredCategories = {
				some: { id: { in: filters.categoryIds } },
			};
		}

		const prismaOrderBy: Prisma.UserModelOrderByWithRelationInput = filters.sortBy
			? { [filters.sortBy]: filters.sortOrder || 'asc' }
			: { createdAt: 'desc' };

		return this.usersRepository.findAllUsers({
			filters: prismaFilters,
			pagination,
			orderBy: prismaOrderBy,
		});
	}

	async getProductsForUser(
		telegramId: string,
		pagination: PaginationDto,
	): Promise<PaginatedResponse<ProductWithRelations>> {
		this.validateTelegramId(telegramId);
		const user = await this.usersRepository.findUserByKeyOrThrow('telegramId', telegramId);
		if (!user.cityId) {
			throw new HTTPError(422, MESSAGES.CITY_NOT_SELECTED);
		}
		if (!user.preferredCategories.length) {
			throw new HTTPError(422, MESSAGES.TELEGRAM_NO_CATEGORIES_SELECTED);
		}
		const categoryIds = user.preferredCategories.map((c) => c.id);
		const prismaFilters: Prisma.ProductModelWhereInput = {
			cityId: user.cityId,
			status: ProductStatus.AVAILABLE,
			isDeleted: false,
			categories: categoryIds.length ? { some: { id: { in: categoryIds } } } : undefined,
		};
		return this.productsRepository.findAllProducts({
			filters: prismaFilters,
			pagination,
		});
	}

	async getUserAddresses(
		id: number,
	): Promise<{ id: number; address: string; isDefault: boolean }[]> {
		return this.prismaService.findUserAddresses(id);
	}

	async updateWarehouseManagerPassword(
		id: number,
		newPassword: string,
		oldPassword: string,
	): Promise<UserWithAddressAndCategories> {
		const user = await this.usersRepository.findUserByKeyOrThrow('id', id);
		const isPasswordValid = await this.comparePassword(oldPassword, user.password);
		if (!isPasswordValid) {
			throw new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'password');
		}
		const hashedPassword = await this.hashPassword(newPassword);
		return this.usersRepository.updateUser(id, { password: hashedPassword });
	}

	async updateUserTelegramId(
		id: number,
		telegramId: string,
	): Promise<UserWithAddressAndCategories> {
		this.validateTelegramId(telegramId);
		return this.usersRepository.updateUser(id, { telegramId });
	}

	async updateUserProfile(
		id: number,
		dto: UserUpdateProfileDto,
		currentUser: { id: number; role: Role },
	): Promise<UserWithAddressAndCategories> {
		if (currentUser.role === Role.WAREHOUSE_MANAGER && currentUser.id !== id) {
			throw new HTTPError(403, MESSAGES.FORBIDDEN_ACCESS);
		}

		await this.usersRepository.findUserByKeyOrThrow('id', id);
		const updateData: Partial<UserModel> = {};

		if (dto.cityId) {
			await this.prismaService.validateCity(dto.cityId);
			updateData.cityId = dto.cityId;
		}

		if (dto.addresses !== undefined) {
			if (dto.addresses.length) {
				const defaultAddresses = dto.addresses.filter((a) => a.isDefault);
				if (defaultAddresses.length > 1) {
					throw new HTTPError(400, MESSAGES.MULTIPLE_DEFAULT_ADDRESS);
				}
				await this.prismaService.deleteUserAddresses(id);
				await this.prismaService.createAddresses(
					id,
					dto.addresses.map((a) => ({
						address: a.address,
						isDefault: a.isDefault,
					})),
				);
			} else {
				await this.prismaService.deleteUserAddresses(id);
			}
		}

		if (dto.categoryIds?.length) {
			await this.prismaService.validateCategories(dto.categoryIds);
		}

		return this.usersRepository.updateUser(id, {
			...updateData,
			...(dto.categoryIds
				? { preferredCategories: { set: dto.categoryIds.map((id) => ({ id })) } }
				: {}),
		});
	}

	async updateUserCity(telegramId: string, cityId: number): Promise<UserWithAddressAndCategories> {
		this.validateTelegramId(telegramId);
		const user = await this.usersRepository.findUserByKeyOrThrow('telegramId', telegramId);
		await this.prismaService.validateCity(cityId);
		return this.usersRepository.updateUserCity(user.id, cityId);
	}

	async updateUserCategories(
		id: number,
		categoryIds: number[],
	): Promise<UserWithAddressAndCategories> {
		if (categoryIds.length) {
			await this.prismaService.validateCategories(categoryIds);
		}
		const categoryData = categoryIds.map((id) => ({ id }));
		return this.usersRepository.updateUserCategories(id, categoryData);
	}

	async deleteWarehouseManager(
		id: number,
		newResponsibleId?: number,
	): Promise<UserWithAddressAndCategories> {
		const user = await this.usersRepository.findUserByKeyOrThrow('id', id);

		const activeProductsCount = await this.productsRepository.findAllProducts({
			filters: {
				createdById: id,
				isDeleted: false,
				isActive: true,
			},
		});

		if (activeProductsCount.total > 0) {
			if (!newResponsibleId) {
				throw new HTTPError(422, MESSAGES.WAREHOUSE_MANAGER_HAS_ACTIVE_PRODUCTS);
			}

			const newResponsible = await this.usersRepository.findUserByKeyOrThrow(
				'id',
				newResponsibleId,
			);
			if (
				![Role.WAREHOUSE_MANAGER, Role.ADMIN, Role.SUPERADMIN].includes(newResponsible.role as Role)
			) {
				throw new HTTPError(422, MESSAGES.INVALID_NEW_RESPONSIBLE_ROLE);
			}

			await this.productsRepository.updateProductCreator(id, newResponsibleId);
		}

		return this.usersRepository.deleteUser(id);
	}

	async login(dto: UserLoginDto): Promise<string> {
		const { email, password } = dto;
		try {
			const user = await this.usersRepository.findUserByKeyOrThrow('email', email);
			const isPasswordValid = await this.comparePassword(password, user.password);
			if (!isPasswordValid) {
				throw new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login');
			}
			return this.signJWT(user.id, user.email, user.role);
		} catch (error: unknown) {
			const err = error instanceof Error ? error : new Error(String(error));
			if (err instanceof HTTPError && err.statusCode === 404) {
				throw new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login');
			}
			throw err;
		}
	}
}
