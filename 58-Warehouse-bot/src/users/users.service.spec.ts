import { Container } from 'inversify';
import { IConfigService } from '../config/config.service.interface';
import {
	IUsersRepository,
	WarehouseManagerResponse,
	UserWithAddressAndCategories,
} from './users.repository.interface';
import { IUsersService } from './users.service.interface';
import { IProductsRepository } from '../products/products.repository.interface';
import { TYPES } from '../types';
import { UsersService } from './users.service';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DEFAULT_PAGINATION } from '../common/constants';
import { Role } from '../common/enums/role.enum';
import { ProductStatus } from '../common/enums/product-status.enum';
import { hash, compare } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { ProductWithRelations } from '../products/products.repository.interface';
import { UserUpdateProfileDto } from './dto/user-update-profile.dto';
import { verify } from 'jsonwebtoken';

jest.mock('bcryptjs', () => ({
	...jest.requireActual('bcryptjs'),
	compare: jest.fn(),
}));

const PrismaServiceMock = {
	findUnique: jest.fn(),
	findCategoriesByIds: jest.fn(),
	validateCity: jest.fn(),
	validateCategories: jest.fn(),
	deleteUserAddresses: jest.fn().mockResolvedValue(undefined),
	createAddresses: jest.fn().mockResolvedValue(undefined),
	findUserAddresses: jest.fn().mockResolvedValue([]),
};

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
	userInclude: {
		city: { select: { id: true, name: true } },
		preferredCategories: { select: { id: true, name: true } },
		addresses: { select: { id: true, address: true, isDefault: true } },
	},
	createUser: jest.fn(),
	findUserByKey: jest.fn(),
	findUserByKeyOrThrow: jest.fn(),
	findAllUsers: jest.fn(),
	updateUser: jest.fn(),
	updateUserCity: jest.fn(),
	updateUserCategories: jest.fn(),
	deleteUser: jest.fn(),
};

const ProductsRepositoryMock: IProductsRepository = {
	productInclude: {
		categories: { select: { id: true, name: true } },
		city: { select: { id: true, name: true } },
	},
	createProduct: jest.fn(),
	findProductByKey: jest.fn(),
	findProductByKeyOrThrow: jest.fn(),
	findProductsByCreator: jest.fn(),
	findAllProducts: jest.fn(),
	findStockProducts: jest.fn(),
	updateProduct: jest.fn(),
	updateProductCreator: jest.fn(),
	deleteProduct: jest.fn(),
};

const container = new Container();
let configService: IConfigService;
let usersRepository: IUsersRepository;
let usersService: IUsersService;

beforeAll(() => {
	container.bind<IUsersService>(TYPES.UsersService).to(UsersService);
	container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(ConfigServiceMock);
	container.bind<IUsersRepository>(TYPES.UsersRepository).toConstantValue(UsersRepositoryMock);
	container.bind(TYPES.PrismaService).toConstantValue(PrismaServiceMock);
	container
		.bind<IProductsRepository>(TYPES.ProductsRepository)
		.toConstantValue(ProductsRepositoryMock);

	configService = container.get<IConfigService>(TYPES.ConfigService);
	usersRepository = container.get<IUsersRepository>(TYPES.UsersRepository);
	usersService = container.get<IUsersService>(TYPES.UsersService);
});

describe('UsersService', () => {
	const mockUser: UserWithAddressAndCategories = {
		id: 1,
		email: 'manager@example.com',
		name: 'Тестовый Начальник Склада',
		password: 'hashed',
		role: Role.WAREHOUSE_MANAGER,
		telegramId: '123',
		cityId: 1,
		preferredCategories: [
			{ id: 1, name: 'Электроника' },
			{ id: 2, name: 'Одежда' },
		],
		addresses: [{ id: 1, address: 'ул. Примерная, 1', isDefault: true }],
		createdAt: new Date(),
		updatedAt: new Date(),
		isDeleted: false,
		city: { id: 1, name: 'Москва' },
	};

	const mockAdmin: UserWithAddressAndCategories = {
		id: 2,
		email: 'admin@example.com',
		name: 'Админ Пользователь',
		password: 'hashed',
		role: Role.ADMIN,
		telegramId: null,
		cityId: null,
		preferredCategories: [],
		addresses: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		isDeleted: false,
		city: null,
	};

	const mockSuperAdmin: UserWithAddressAndCategories = {
		id: 3,
		email: 'superadmin@example.com',
		name: 'Суперадмин Пользователь',
		password: 'hashed',
		role: Role.SUPERADMIN,
		telegramId: null,
		cityId: null,
		preferredCategories: [],
		addresses: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		isDeleted: false,
		city: null,
	};

	const mockManagers: WarehouseManagerResponse[] = [
		{
			id: 1,
			email: 'test@example.com',
			name: 'Тестовый Пользователь',
			role: Role.WAREHOUSE_MANAGER,
			createdAt: new Date(),
			updatedAt: new Date(),
			telegramId: null,
			cityId: null,
			city: null,
			preferredCategories: [],
			addresses: [],
			isDeleted: false,
		},
		{
			id: 4,
			email: 'manager2@example.com',
			name: 'Начальник Склада 2',
			role: Role.WAREHOUSE_MANAGER,
			createdAt: new Date(),
			updatedAt: new Date(),
			telegramId: null,
			cityId: null,
			city: null,
			preferredCategories: [],
			addresses: [],
			isDeleted: false,
		},
	];

	const mockProducts: PaginatedResponse<ProductWithRelations> = {
		items: [
			{
				id: 1,
				name: 'Товар 1',
				description: 'Описание товара',
				createdById: 1,
				updatedById: null,
				cityId: 1,
				city: { id: 1, name: 'Москва' },
				categories: [{ id: 1, name: 'Электроника' }],
				price: 1000,
				quantity: 10,
				sku: 'SKU123',
				status: ProductStatus.AVAILABLE,
				isActive: true,
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		],
		total: 1,
		meta: {
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
		PrismaServiceMock.findUnique = jest.fn().mockResolvedValue(null);
		PrismaServiceMock.findCategoriesByIds = jest.fn().mockResolvedValue([]);
		PrismaServiceMock.validateCity = jest.fn().mockResolvedValue(undefined);
		PrismaServiceMock.validateCategories = jest.fn().mockResolvedValue(undefined);
		PrismaServiceMock.deleteUserAddresses = jest.fn().mockResolvedValue(undefined);
		PrismaServiceMock.createAddresses = jest.fn().mockResolvedValue(undefined);
		PrismaServiceMock.findUserAddresses = jest.fn().mockResolvedValue([]);
		usersRepository.createUser = jest.fn().mockImplementation((data) => {
			if (data.role === Role.ADMIN) {
				return Promise.resolve(mockAdmin);
			}
			return Promise.resolve(mockUser);
		});
		usersRepository.findUserByKey = jest.fn().mockImplementation((key, value) => {
			if (key === 'telegramId' && value === mockUser.telegramId) {
				return Promise.resolve(mockUser);
			}
			return Promise.resolve(null);
		});
		usersRepository.findUserByKeyOrThrow = jest.fn().mockImplementation((key, value) => {
			if (key === 'id' && value === mockAdmin.id) {
				return Promise.resolve(mockAdmin);
			}
			if (key === 'id' && value === mockUser.id) {
				return Promise.resolve(mockUser);
			}
			if (key === 'telegramId' && value === mockUser.telegramId) {
				return Promise.resolve(mockUser);
			}
			if (key === 'email' && value === mockUser.email) {
				return Promise.resolve(mockUser);
			}
			return Promise.reject(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
		});
		usersRepository.deleteUser = jest.fn().mockImplementation((id) => {
			if (id === mockUser.id) {
				return Promise.resolve({ ...mockUser, isDeleted: true });
			}
			if (id === mockAdmin.id) {
				return Promise.resolve({ ...mockAdmin, isDeleted: true });
			}
			return Promise.reject(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
		});
		usersRepository.updateUser = jest.fn().mockImplementation((id, data) => {
			if (id === mockUser.id) {
				return Promise.resolve({ ...mockUser, ...data });
			}
			if (id === mockAdmin.id) {
				return Promise.resolve({ ...mockAdmin, ...data });
			}
			return Promise.reject(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
		});
		usersRepository.findAllUsers = jest.fn().mockResolvedValue({
			items: mockManagers,
			total: mockManagers.length,
			meta: {
				total: mockManagers.length,
				page: 1,
				limit: 10,
				totalPages: 1,
			},
		});
	});

	describe('Создание администратора', () => {
		it('успешно создает администратора с хэшированным паролем', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest.fn().mockResolvedValue(mockAdmin);
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockAdmin);

			const result = await usersService.createUser(
				{
					email: 'admin@example.com',
					name: 'Админ Пользователь',
					password: 'password123',
				},
				Role.ADMIN,
			);

			expect(result).toEqual(mockAdmin);
			expect(usersRepository.createUser).toHaveBeenCalled();
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', mockAdmin.id);
			const createCall = (usersRepository.createUser as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe(Role.ADMIN);
			expect(createCall.email).toBe('admin@example.com');
			expect(createCall.password).not.toBe('password123');
		});

		it('выбрасывает ошибку 409 при дублировании email', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest.fn().mockRejectedValue(
				new Prisma.PrismaClientKnownRequestError(MESSAGES.UNIQUE_CONSTRAINT_FAILED, {
					code: 'P2002',
					clientVersion: '0.0.0',
				}),
			);

			await expect(
				usersService.createUser(
					{
						email: 'admin@example.com',
						name: 'Админ Пользователь',
						password: 'password123',
					},
					Role.ADMIN,
				),
			).rejects.toThrowError(new HTTPError(409, MESSAGES.UNIQUE_CONSTRAINT_FAILED));
		});
	});

	describe('Создание начальника склада', () => {
		it('успешно создает начальника склада с хэшированным паролем', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest.fn().mockImplementation((data) => {
				return Promise.resolve(mockUser);
			});
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			PrismaServiceMock.validateCity = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.validateCategories = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.deleteUserAddresses = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.createAddresses = jest.fn().mockResolvedValue(undefined);

			const result = await usersService.createUser(
				{
					email: 'manager@example.com',
					name: 'Тестовый Начальник Склада',
					password: 'password123',
					cityId: 1,
					categoryIds: [1, 2],
					addresses: [{ address: 'ул. Примерная, 1', isDefault: true }],
				},
				Role.WAREHOUSE_MANAGER,
			);

			expect(result).toEqual(mockUser);
			expect(usersRepository.createUser).toHaveBeenCalled();
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', mockUser.id);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(1);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([1, 2]);
			expect(PrismaServiceMock.deleteUserAddresses).toHaveBeenCalledWith(mockUser.id);
			expect(PrismaServiceMock.createAddresses).toHaveBeenCalledWith(mockUser.id, [
				{ address: 'ул. Примерная, 1', isDefault: true },
			]);
			const createCall = (usersRepository.createUser as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe(Role.WAREHOUSE_MANAGER);
			expect(createCall.email).toBe('manager@example.com');
			expect(createCall.password).not.toBe('password123');
			expect(createCall.cityId).toBe(1);
			expect(createCall.preferredCategories).toEqual([1, 2]);
		});

		it('выбрасывает ошибку 409 при дублировании email', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest.fn().mockRejectedValue(
				new Prisma.PrismaClientKnownRequestError(MESSAGES.UNIQUE_CONSTRAINT_FAILED, {
					code: 'P2002',
					clientVersion: '0.0.0',
				}),
			);

			await expect(
				usersService.createUser(
					{
						email: 'manager@example.com',
						name: 'Тестовый Начальник Склада',
						password: 'password123',
						cityId: 1,
						categoryIds: [1, 2],
					},
					Role.WAREHOUSE_MANAGER,
				),
			).rejects.toThrowError(new HTTPError(409, MESSAGES.UNIQUE_CONSTRAINT_FAILED));
		});
	});

	describe('Создание Telegram-пользователя', () => {
		it('успешно создает Telegram-пользователя', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest.fn().mockResolvedValue(mockUser);
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.createTelegramUser('123', 'Тестовый Начальник Склада');

			expect(result).toEqual(mockUser);
			expect(usersRepository.createUser).toHaveBeenCalled();
			const createCall = (usersRepository.createUser as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe(Role.WAREHOUSE_MANAGER);
			expect(createCall.email).toMatch(/^telegram_123@example\.com$/);
			expect(createCall.password).not.toBe('password123');
		});

		it('возвращает существующего пользователя при дублировании telegramId', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest
				.fn()
				.mockRejectedValue(new HTTPError(409, MESSAGES.UNIQUE_CONSTRAINT_FAILED));
			usersRepository.findUserByKey = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.createTelegramUser('123', 'Тестовый Начальник Склада');

			expect(result).toEqual(mockUser);
			expect(usersRepository.findUserByKey).toHaveBeenCalledWith('telegramId', '123');
		});

		it('выбрасывает ошибку 400 для невалидного telegramId', async () => {
			await expect(
				usersService.createTelegramUser('invalid', 'Тестовый Начальник Склада'),
			).rejects.toThrowError(new HTTPError(400, MESSAGES.TELEGRAM_ID_NOT_FOUND));
		});
	});

	describe('Получение информации о пользователе по Telegram ID', () => {
		it('возвращает информацию о пользователе по telegramId', async () => {
			usersRepository.findUserByKey = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.getUserInfoByTelegramId('123');

			expect(result).toEqual(mockUser);
			expect(usersRepository.findUserByKey).toHaveBeenCalledWith('telegramId', '123');
		});

		it('возвращает null, если пользователь не найден', async () => {
			usersRepository.findUserByKey = jest.fn().mockResolvedValue(null);

			const result = await usersService.getUserInfoByTelegramId('123');

			expect(result).toBeNull();
			expect(usersRepository.findUserByKey).toHaveBeenCalledWith('telegramId', '123');
		});

		it('выбрасывает ошибку 400 для невалидного telegramId', async () => {
			await expect(usersService.getUserInfoByTelegramId('invalid')).rejects.toThrowError(
				new HTTPError(400, MESSAGES.TELEGRAM_ID_NOT_FOUND),
			);
		});
	});

	describe('Аутентификация пользователя', () => {
		it('успешно аутентифицирует пользователя с правильным паролем', async () => {
			const salt = 10;
			const hashedPassword = await hash('password123', salt);
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockUser,
				email: 'test@example.com',
				password: hashedPassword,
			});
			configService.get = jest.fn().mockImplementation((key) => {
				if (key === 'SALT') return '10';
				if (key === 'SECRET') return 'MYAPPSECRET';
			});

			(compare as jest.Mock).mockResolvedValue(true);

			const result = await usersService.login({
				email: 'test@example.com',
				password: 'password123',
			});

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith(
				'email',
				'test@example.com',
			);
			const decoded = verify(result, 'MYAPPSECRET');
			expect(decoded).toEqual(
				expect.objectContaining({
					email: 'test@example.com',
					role: Role.WAREHOUSE_MANAGER,
				}),
			);
		});

		it('выбрасывает ошибку 401 при неверном пароле', async () => {
			const salt = 10;
			const hashedPassword = await hash('password123', salt);
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockUser,
				email: 'manager@example.com',
				password: hashedPassword,
			});

			(compare as jest.Mock).mockResolvedValue(false);

			await expect(
				usersService.login({
					email: 'manager@example.com',
					password: 'wrongpassword',
				}),
			).rejects.toThrowError(new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login'));

			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith(
				'email',
				'manager@example.com',
			);
		});

		it('выбрасывает ошибку 401, если пользователь не найден', async () => {
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(
				usersService.login({
					email: 'nonexistent@example.com',
					password: 'password123',
				}),
			).rejects.toThrowError(new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login'));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith(
				'email',
				'nonexistent@example.com',
			);
		});
	});

	describe('Обновление пароля начальника склада', () => {
		it('успешно обновляет пароль начальника склада', async () => {
			const salt = 10;
			const hashedOldPassword = await hash('oldpassword', salt);
			const hashedNewPassword = await hash('newpassword', salt);
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockUser,
				password: hashedOldPassword,
			});
			usersRepository.updateUser = jest.fn().mockResolvedValue({
				...mockUser,
				password: hashedNewPassword,
			});
			configService.get = jest.fn().mockReturnValue('10');
			(compare as jest.Mock).mockResolvedValue(true);

			const result = await usersService.updateWarehouseManagerPassword(
				1,
				'newpassword',
				'oldpassword',
			);

			expect(result.password).toBe(hashedNewPassword);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(usersRepository.updateUser).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ password: expect.any(String) }),
			);
			expect(compare).toHaveBeenCalledWith('oldpassword', hashedOldPassword);
		});

		it('успешно обновляет пароль для администратора', async () => {
			const salt = 10;
			const hashedOldPassword = await hash('oldpassword', salt);
			const hashedNewPassword = await hash('newpassword', salt);
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockAdmin,
				password: hashedOldPassword,
			});
			usersRepository.updateUser = jest.fn().mockResolvedValue({
				...mockAdmin,
				password: hashedNewPassword,
			});
			configService.get = jest.fn().mockReturnValue('10');
			(compare as jest.Mock).mockResolvedValue(true);

			const result = await usersService.updateWarehouseManagerPassword(
				2,
				'newpassword',
				'oldpassword',
			);

			expect(result.password).toBe(hashedNewPassword);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 2);
			expect(usersRepository.updateUser).toHaveBeenCalledWith(
				2,
				expect.objectContaining({ password: expect.any(String) }),
			);
			expect(compare).toHaveBeenCalledWith('oldpassword', hashedOldPassword);
		});

		it('выбрасывает ошибку 401 при неверном старом пароле', async () => {
			const salt = 10;
			const hashedOldPassword = await hash('correctpassword', salt);
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockUser,
				password: hashedOldPassword,
			});
			(compare as jest.Mock).mockResolvedValue(false);

			await expect(
				usersService.updateWarehouseManagerPassword(1, 'newpassword', 'wrongpassword'),
			).rejects.toThrowError(new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'password'));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(compare).toHaveBeenCalledWith('wrongpassword', hashedOldPassword);
		});

		it('выбрасывает ошибку 404, если пользователь не найден', async () => {
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(
				usersService.updateWarehouseManagerPassword(1, 'newpassword', 'oldpassword'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
		});
	});

	describe('Удаление начальника склада', () => {
		it('успешно удаляет начальника склада', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			ProductsRepositoryMock.findAllProducts = jest.fn().mockResolvedValue({
				items: [],
				total: 0,
			});
			usersRepository.deleteUser = jest.fn().mockResolvedValue({
				...mockUser,
				isDeleted: true,
			});

			const result = await usersService.deleteWarehouseManager(1);

			expect(result).toEqual({
				...mockUser,
				isDeleted: true,
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(ProductsRepositoryMock.findAllProducts).toHaveBeenCalledWith({
				filters: {
					createdById: 1,
					isActive: true,
					isDeleted: false,
				},
			});
			expect(usersRepository.deleteUser).toHaveBeenCalledWith(1);
		});

		it('успешно удаляет администратора', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockAdmin);
			ProductsRepositoryMock.findAllProducts = jest.fn().mockResolvedValue({ items: [], total: 0 });
			usersRepository.deleteUser = jest.fn().mockResolvedValue({
				...mockAdmin,
				isDeleted: true,
			});

			const result = await usersService.deleteWarehouseManager(2);

			expect(result).toEqual({
				...mockAdmin,
				isDeleted: true,
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 2);
			expect(ProductsRepositoryMock.findAllProducts).toHaveBeenCalledWith({
				filters: {
					createdById: 2,
					isActive: true,
					isDeleted: false,
				},
			});
			expect(usersRepository.deleteUser).toHaveBeenCalledWith(2);
		});

		it('выбрасывает ошибку 422, если у начальника склада есть активные товары', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			ProductsRepositoryMock.findAllProducts = jest.fn().mockResolvedValue(mockProducts);
			usersRepository.deleteUser = jest.fn();

			await expect(usersService.deleteWarehouseManager(1)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.WAREHOUSE_MANAGER_HAS_ACTIVE_PRODUCTS),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(ProductsRepositoryMock.findAllProducts).toHaveBeenCalledWith({
				filters: {
					createdById: 1,
					isActive: true,
					isDeleted: false,
				},
			});
			expect(usersRepository.deleteUser).not.toHaveBeenCalled();
		});

		it('успешно переназначает товары другому ответственному', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockImplementation((key, value) => {
				if (value === 1) return Promise.resolve(mockUser);
				if (value === 2) return Promise.resolve(mockAdmin);
				return Promise.reject(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			});
			ProductsRepositoryMock.findAllProducts = jest.fn().mockResolvedValue(mockProducts);
			ProductsRepositoryMock.updateProductCreator = jest.fn().mockResolvedValue(undefined);
			usersRepository.deleteUser = jest.fn().mockResolvedValue({
				...mockUser,
				isDeleted: true,
			});

			const result = await usersService.deleteWarehouseManager(1, 2);

			expect(result).toEqual({
				...mockUser,
				isDeleted: true,
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 2);
			expect(ProductsRepositoryMock.findAllProducts).toHaveBeenCalledWith({
				filters: {
					createdById: 1,
					isActive: true,
					isDeleted: false,
				},
			});
			expect(ProductsRepositoryMock.updateProductCreator).toHaveBeenCalledWith(1, 2);
			expect(usersRepository.deleteUser).toHaveBeenCalledWith(1);
		});

		it('выбрасывает ошибку 422, если новый ответственный имеет неверную роль', async () => {
			const invalidUser: UserWithAddressAndCategories = {
				...mockUser,
				id: 4,
				role: 'USER' as Role,
			};
			usersRepository.findUserByKeyOrThrow = jest.fn().mockImplementation((key, value) => {
				if (value === 1) return Promise.resolve(mockUser);
				if (value === 4) return Promise.resolve(invalidUser);
				return Promise.reject(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			});
			ProductsRepositoryMock.findAllProducts = jest.fn().mockResolvedValue(mockProducts);

			await expect(usersService.deleteWarehouseManager(1, 4)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INVALID_NEW_RESPONSIBLE_ROLE),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 4);
			expect(ProductsRepositoryMock.findAllProducts).toHaveBeenCalledWith({
				filters: {
					createdById: 1,
					isActive: true,
					isDeleted: false,
				},
			});
			expect(ProductsRepositoryMock.updateProductCreator).not.toHaveBeenCalled();
			expect(usersRepository.deleteUser).not.toHaveBeenCalled();
		});
	});

	describe('Получение информации о пользователе', () => {
		it('возвращает информацию о пользователе по email', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.getUserInfoByEmail('manager@example.com');

			expect(result).toEqual(mockUser);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith(
				'email',
				'manager@example.com',
			);
		});

		it('выбрасывает ошибку 404, если пользователь не найден', async () => {
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.getUserInfoByEmail('nonexistent@example.com')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith(
				'email',
				'nonexistent@example.com',
			);
		});
	});

	describe('Получение информации о пользователе по ID', () => {
		it('возвращает информацию о пользователе по ID', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.getUserInfoById(1);

			expect(result).toEqual(mockUser);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
		});

		it('выбрасывает ошибку 404, если пользователь не найден', async () => {
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.getUserInfoById(999)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 999);
		});

		it('выбрасывает ошибку 404 для невалидного ID', async () => {
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.getUserInfoById(0)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			await expect(usersService.getUserInfoById(NaN)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 0);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', NaN);
		});
	});

	describe('Получение всех начальников склада', () => {
		it('возвращает список начальников склада с пагинацией', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			const paginatedResponse: PaginatedResponse<WarehouseManagerResponse> = {
				items: mockManagers,
				total: mockManagers.length,
				meta: {
					total: mockManagers.length,
					page: 1,
					limit: 10,
					totalPages: 1,
				},
			};
			usersRepository.findAllUsers = jest.fn().mockResolvedValue(paginatedResponse);

			const result = await usersService.getAllWarehouseManagers({ pagination });

			expect(result).toEqual(paginatedResponse);
			expect(usersRepository.findAllUsers).toHaveBeenCalledWith({
				filters: { role: Role.WAREHOUSE_MANAGER, isDeleted: false },
				pagination,
				orderBy: { createdAt: 'desc' },
			});
		});

		it('использует пагинацию по умолчанию, если параметры не указаны', async () => {
			const paginatedResponse: PaginatedResponse<WarehouseManagerResponse> = {
				items: mockManagers,
				total: mockManagers.length,
				meta: {
					total: mockManagers.length,
					page: 1,
					limit: 10,
					totalPages: 1,
				},
			};
			usersRepository.findAllUsers = jest.fn().mockResolvedValue(paginatedResponse);

			const result = await usersService.getAllWarehouseManagers({});

			expect(result).toEqual(paginatedResponse);
			expect(usersRepository.findAllUsers).toHaveBeenCalledWith({
				filters: { role: Role.WAREHOUSE_MANAGER, isDeleted: false },
				pagination: DEFAULT_PAGINATION,
				orderBy: { createdAt: 'desc' },
			});
		});
	});

	describe('Получение товаров для пользователя', () => {
		it('успешно возвращает товары для пользователя с telegramId', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			ProductsRepositoryMock.findAllProducts = jest.fn().mockResolvedValue(mockProducts);

			const result = await usersService.getProductsForUser('123', pagination);

			expect(result).toEqual(mockProducts);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('telegramId', '123');
			expect(ProductsRepositoryMock.findAllProducts).toHaveBeenCalledWith({
				filters: {
					cityId: 1,
					status: ProductStatus.AVAILABLE,
					isDeleted: false,
					categories: { some: { id: { in: [1, 2] } } },
				},
				pagination,
			});
		});

		it('выбрасывает ошибку 422, если у пользователя не указан город', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockUser,
				cityId: null,
			});

			await expect(usersService.getProductsForUser('123', pagination)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.CITY_NOT_SELECTED),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('telegramId', '123');
			expect(ProductsRepositoryMock.findAllProducts).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 422, если у пользователя не выбраны категории', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockUser,
				preferredCategories: [],
			});

			await expect(usersService.getProductsForUser('123', pagination)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.TELEGRAM_NO_CATEGORIES_SELECTED),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('telegramId', '123');
			expect(ProductsRepositoryMock.findAllProducts).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 400 для невалидного telegramId', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			await expect(usersService.getProductsForUser('invalid', pagination)).rejects.toThrowError(
				new HTTPError(400, MESSAGES.TELEGRAM_ID_NOT_FOUND),
			);
			expect(usersRepository.findUserByKeyOrThrow).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 404, если пользователь не найден', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.getProductsForUser('123', pagination)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('telegramId', '123');
		});
	});

	describe('Обновление Telegram ID пользователя', () => {
		it('успешно обновляет Telegram ID пользователя', async () => {
			usersRepository.updateUser = jest.fn().mockResolvedValue({
				...mockUser,
				telegramId: '456',
			});

			const result = await usersService.updateUserTelegramId(1, '456');

			expect(result).toEqual({ ...mockUser, telegramId: '456' });
			expect(usersRepository.updateUser).toHaveBeenCalledWith(1, { telegramId: '456' });
		});

		it('выбрасывает ошибку 400 для невалидного telegramId', async () => {
			await expect(usersService.updateUserTelegramId(1, 'invalid')).rejects.toThrowError(
				new HTTPError(400, MESSAGES.TELEGRAM_ID_NOT_FOUND),
			);
			expect(usersRepository.updateUser).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 404, если пользователь не найден', async () => {
			usersRepository.updateUser = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.updateUserTelegramId(999, '456')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersRepository.updateUser).toHaveBeenCalledWith(999, { telegramId: '456' });
		});
	});

	describe('Обновление профиля пользователя', () => {
		it('успешно обновляет профиль пользователя для суперадминистратора', async () => {
			const updateDto: UserUpdateProfileDto = {
				name: 'Новое Имя',
				cityId: 2,
				categoryIds: [3, 4],
				addresses: [{ address: 'ул. Новая, 2', isDefault: true }],
			};
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockAdmin);
			usersRepository.updateUser = jest.fn().mockResolvedValue({
				...mockAdmin,
				name: 'Новое Имя',
				cityId: 2,
				city: { id: 2, name: 'Санкт-Петербург' },
				preferredCategories: [
					{ id: 3, name: 'Техника' },
					{ id: 4, name: 'Книги' },
				],
				addresses: [{ id: 2, address: 'ул. Новая, 2', isDefault: true }],
			});
			PrismaServiceMock.validateCity = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.validateCategories = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.deleteUserAddresses = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.createAddresses = jest.fn().mockResolvedValue(undefined);

			const result = await usersService.updateUserProfile(2, updateDto, {
				id: 3,
				role: Role.SUPERADMIN,
			});

			expect(result).toEqual({
				...mockAdmin,
				name: 'Новое Имя',
				cityId: 2,
				city: { id: 2, name: 'Санкт-Петербург' },
				preferredCategories: [
					{ id: 3, name: 'Техника' },
					{ id: 4, name: 'Книги' },
				],
				addresses: [{ id: 2, address: 'ул. Новая, 2', isDefault: true }],
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 2);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(2);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([3, 4]);
			expect(PrismaServiceMock.deleteUserAddresses).toHaveBeenCalledWith(2);
			expect(PrismaServiceMock.createAddresses).toHaveBeenCalledWith(2, [
				{ address: 'ул. Новая, 2', isDefault: true },
			]);
			expect(usersRepository.updateUser).toHaveBeenCalledWith(2, {
				cityId: 2,
				preferredCategories: { set: [{ id: 3 }, { id: 4 }] },
			});
		});

		it('успешно обновляет профиль начальника склада (собственный профиль)', async () => {
			const updateDto: UserUpdateProfileDto = {
				name: 'Новое Имя',
				cityId: 2,
				categoryIds: [3, 4],
				addresses: [{ address: 'ул. Новая, 2', isDefault: true }],
			};
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			usersRepository.updateUser = jest.fn().mockResolvedValue({
				...mockUser,
				name: 'Новое Имя',
				cityId: 2,
				city: { id: 2, name: 'Санкт-Петербург' },
				preferredCategories: [
					{ id: 3, name: 'Техника' },
					{ id: 4, name: 'Книги' },
				],
				addresses: [{ id: 2, address: 'ул. Новая, 2', isDefault: true }],
			});
			PrismaServiceMock.validateCity = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.validateCategories = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.deleteUserAddresses = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.createAddresses = jest.fn().mockResolvedValue(undefined);

			const result = await usersService.updateUserProfile(1, updateDto, {
				id: 1,
				role: Role.WAREHOUSE_MANAGER,
			});

			expect(result).toEqual({
				...mockUser,
				name: 'Новое Имя',
				cityId: 2,
				city: { id: 2, name: 'Санкт-Петербург' },
				preferredCategories: [
					{ id: 3, name: 'Техника' },
					{ id: 4, name: 'Книги' },
				],
				addresses: [{ id: 2, address: 'ул. Новая, 2', isDefault: true }],
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(2);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([3, 4]);
			expect(PrismaServiceMock.deleteUserAddresses).toHaveBeenCalledWith(1);
			expect(PrismaServiceMock.createAddresses).toHaveBeenCalledWith(1, [
				{ address: 'ул. Новая, 2', isDefault: true },
			]);
			expect(usersRepository.updateUser).toHaveBeenCalledWith(1, {
				cityId: 2,
				preferredCategories: { set: [{ id: 3 }, { id: 4 }] },
			});
		});

		it('выбрасывает ошибку 403, если начальник склада пытается обновить чужой профиль', async () => {
			const updateDto: UserUpdateProfileDto = {
				name: 'Новое Имя',
			};
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockAdmin);

			await expect(
				usersService.updateUserProfile(2, updateDto, { id: 1, role: Role.WAREHOUSE_MANAGER }),
			).rejects.toThrowError(new HTTPError(403, MESSAGES.FORBIDDEN_ACCESS));
			expect(usersRepository.findUserByKeyOrThrow).not.toHaveBeenCalled();
			expect(usersRepository.updateUser).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 404, если пользователь не найден', async () => {
			const updateDto: UserUpdateProfileDto = {
				name: 'Новое Имя',
			};
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(
				usersService.updateUserProfile(999, updateDto, { id: 3, role: Role.SUPERADMIN }),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 999);
			expect(usersRepository.updateUser).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 404, если город не существует', async () => {
			const updateDto: UserUpdateProfileDto = {
				cityId: 999,
			};
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			PrismaServiceMock.validateCity = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.CITY_NOT_FOUND));

			await expect(
				usersService.updateUserProfile(1, updateDto, { id: 3, role: Role.SUPERADMIN }),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.CITY_NOT_FOUND));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(999);
			expect(usersRepository.updateUser).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 404, если категории не существуют', async () => {
			const updateDto: UserUpdateProfileDto = {
				categoryIds: [999],
			};
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			PrismaServiceMock.validateCategories = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.CATEGORY_NOT_FOUND));

			await expect(
				usersService.updateUserProfile(1, updateDto, { id: 3, role: Role.SUPERADMIN }),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.CATEGORY_NOT_FOUND));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([999]);
			expect(usersRepository.updateUser).not.toHaveBeenCalled();
		});
	});

	describe('Обновление категорий пользователя', () => {
		it('успешно обновляет категории пользователя', async () => {
			const categoryIds = [3, 4];
			usersRepository.updateUserCategories = jest.fn().mockResolvedValue({
				...mockUser,
				preferredCategories: [
					{ id: 3, name: 'Техника' },
					{ id: 4, name: 'Книги' },
				],
			});

			const result = await usersService.updateUserCategories(1, categoryIds);

			expect(result).toEqual({
				...mockUser,
				preferredCategories: [
					{ id: 3, name: 'Техника' },
					{ id: 4, name: 'Книги' },
				],
			});
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith(categoryIds);
			expect(usersRepository.updateUserCategories).toHaveBeenCalledWith(1, [{ id: 3 }, { id: 4 }]);
		});

		it('успешно очищает категории, если передан пустой массив', async () => {
			const categoryIds: number[] = [];
			usersRepository.updateUserCategories = jest.fn().mockResolvedValue({
				...mockUser,
				preferredCategories: [],
			});

			const result = await usersService.updateUserCategories(1, categoryIds);

			expect(result).toEqual({
				...mockUser,
				preferredCategories: [],
			});
			expect(PrismaServiceMock.validateCategories).not.toHaveBeenCalled();
			expect(usersRepository.updateUserCategories).toHaveBeenCalledWith(1, []);
		});

		it('выбрасывает ошибку 404, если категории не существуют', async () => {
			const categoryIds = [999];
			PrismaServiceMock.validateCategories = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.CATEGORY_NOT_FOUND));

			await expect(usersService.updateUserCategories(1, categoryIds)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.CATEGORY_NOT_FOUND),
			);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith(categoryIds);
			expect(usersRepository.updateUserCategories).not.toHaveBeenCalled();
		});
	});
});
