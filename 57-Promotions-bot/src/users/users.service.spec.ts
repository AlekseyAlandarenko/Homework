import { Container } from 'inversify';
import { IConfigService } from '../config/config.service.interface';
import {
	IUsersRepository,
	SupplierResponse,
	UserWithCategories,
} from './users.repository.interface';
import { IUsersService } from './users.service.interface';
import { IPromotionsRepository } from '../promotions/promotions.repository.interface';
import { TYPES } from '../types';
import { UsersService } from './users.service';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DEFAULT_PAGINATION } from '../common/constants';
import { Role } from '../common/enums/role.enum';
import { PromotionStatus } from '../common/enums/promotion-status.enum';
import { hash, compare } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PromotionWithRelations } from '../promotions/promotions.repository.interface';
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
};

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
	userInclude: {
		city: { select: { id: true, name: true } },
		preferredCategories: { select: { id: true, name: true } },
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

const PromotionsRepositoryMock: IPromotionsRepository = {
	promotionInclude: {
		categories: { select: { id: true, name: true } },
		city: { select: { id: true, name: true } },
	},
	createPromotion: jest.fn(),
	findPromotionByKey: jest.fn(),
	findPromotionByKeyOrThrow: jest.fn(),
	findPromotionsBySupplier: jest.fn(),
	findAllPromotions: jest.fn(),
	updatePromotion: jest.fn(),
	deletePromotion: jest.fn(),
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
		.bind<IPromotionsRepository>(TYPES.PromotionsRepository)
		.toConstantValue(PromotionsRepositoryMock);

	configService = container.get<IConfigService>(TYPES.ConfigService);
	usersRepository = container.get<IUsersRepository>(TYPES.UsersRepository);
	usersService = container.get<IUsersService>(TYPES.UsersService);
});

describe('UsersService', () => {
	const mockUser: UserWithCategories = {
		id: 1,
		email: 'test@example.com',
		name: 'Тестовый Пользователь',
		password: 'hashed',
		role: Role.SUPPLIER,
		telegramId: '123',
		cityId: 1,
		preferredCategories: [
			{ id: 1, name: 'Еда' },
			{ id: 2, name: 'Одежда' },
		],
		createdAt: new Date(),
		updatedAt: new Date(),
		isDeleted: false,
		notificationsEnabled: true,
		city: { id: 1, name: 'Москва' },
	};

	const mockAdmin: UserWithCategories = {
		id: 2,
		email: 'admin@example.com',
		name: 'Админ Пользователь',
		password: 'hashed',
		role: Role.ADMIN,
		telegramId: null,
		cityId: null,
		preferredCategories: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		isDeleted: false,
		notificationsEnabled: false,
		city: null,
	};

	const mockSuperAdmin: UserWithCategories = {
		id: 3,
		email: 'superadmin@example.com',
		name: 'Суперадмин Пользователь',
		password: 'hashed',
		role: Role.SUPERADMIN,
		telegramId: null,
		cityId: null,
		preferredCategories: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		isDeleted: false,
		notificationsEnabled: false,
		city: null,
	};

	const mockSuppliers: SupplierResponse[] = [
		{
			id: 1,
			email: 'test@example.com',
			name: 'Тестовый Пользователь',
			role: Role.SUPPLIER,
			createdAt: new Date(),
			updatedAt: new Date(),
			telegramId: null,
			cityId: null,
			city: null,
			preferredCategories: [],
			isDeleted: false,
			notificationsEnabled: true,
		},
		{
			id: 4,
			email: 'supplier2@example.com',
			name: 'Поставщик 2',
			role: Role.SUPPLIER,
			createdAt: new Date(),
			updatedAt: new Date(),
			telegramId: null,
			cityId: null,
			city: null,
			preferredCategories: [],
			isDeleted: false,
			notificationsEnabled: true,
		},
	];

	const mockPromotions: PaginatedResponse<PromotionWithRelations> = {
		items: [
			{
				id: 1,
				title: 'Акция 1',
				description: 'Описание акции',
				supplierId: 1,
				cityId: 1,
				city: { id: 1, name: 'Москва' },
				categories: [{ id: 1, name: 'Еда' }],
				startDate: new Date(),
				endDate: new Date(),
				status: PromotionStatus.APPROVED,
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				imageUrl: null,
				linkUrl: null,
				publicationDate: null,
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
		jest.spyOn({ compare }, 'compare').mockRestore();
		PrismaServiceMock.findUnique = jest.fn().mockResolvedValue(null);
		PrismaServiceMock.findCategoriesByIds = jest.fn().mockResolvedValue([]);
		PrismaServiceMock.validateCity = jest.fn().mockResolvedValue(true);
		PrismaServiceMock.validateCategories = jest.fn().mockResolvedValue(true);
	});

	describe('Создание администратора', () => {
		it('успешно создает администратора с хэшированным паролем', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest.fn().mockResolvedValue(mockAdmin);

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

	describe('Создание поставщика', () => {
		it('успешно создает поставщика с хэшированным паролем', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.createUser(
				{
					email: 'test@example.com',
					name: 'Тестовый Пользователь',
					password: 'password123',
				},
				Role.SUPPLIER,
			);

			expect(result).toEqual(mockUser);
			expect(usersRepository.createUser).toHaveBeenCalled();
			const createCall = (usersRepository.createUser as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe(Role.SUPPLIER);
			expect(createCall.email).toBe('test@example.com');
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
						email: 'test@example.com',
						name: 'Тестовый Пользователь',
						password: 'password123',
					},
					Role.SUPPLIER,
				),
			).rejects.toThrowError(new HTTPError(409, MESSAGES.UNIQUE_CONSTRAINT_FAILED));
		});
	});

	describe('Создание Telegram-пользователя', () => {
		it('успешно создает Telegram-пользователя', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.createTelegramUser('123', 'Тестовый Пользователь');

			expect(result).toEqual(mockUser);
			expect(usersRepository.createUser).toHaveBeenCalled();
			const createCall = (usersRepository.createUser as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe(Role.SUPPLIER);
			expect(createCall.email).toMatch(/^telegram_123@example\.com$/);
			expect(createCall.password).not.toBe('password123');
		});

		it('возвращает существующего пользователя при дублировании telegramId', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.createUser = jest
				.fn()
				.mockRejectedValue(new HTTPError(409, MESSAGES.UNIQUE_CONSTRAINT_FAILED));
			usersRepository.findUserByKey = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.createTelegramUser('123', 'Тестовый Пользователь');

			expect(result).toEqual(mockUser);
			expect(usersRepository.findUserByKey).toHaveBeenCalledWith('telegramId', '123');
		});

		it('выбрасывает ошибку 400 для невалидного telegramId', async () => {
			await expect(
				usersService.createTelegramUser('invalid', 'Тестовый Пользователь'),
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
					role: Role.SUPPLIER,
				}),
			);
		});

		it('выбрасывает ошибку 401 при неверном пароле', async () => {
			const salt = 10;
			const hashedPassword = await hash('password123', salt);
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockUser,
				email: 'test@example.com',
				password: hashedPassword,
			});

			await expect(
				usersService.login({
					email: 'test@example.com',
					password: 'wrongpassword',
				}),
			).rejects.toThrowError(new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login'));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith(
				'email',
				'test@example.com',
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

	describe('Обновление пароля поставщика', () => {
		it('успешно обновляет пароль поставщика', async () => {
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

			const result = await usersService.updateSupplierPassword(1, 'newpassword', 'oldpassword');

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

			const result = await usersService.updateSupplierPassword(2, 'newpassword', 'oldpassword');

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
				usersService.updateSupplierPassword(1, 'newpassword', 'wrongpassword'),
			).rejects.toThrowError(new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'password'));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(compare).toHaveBeenCalledWith('wrongpassword', hashedOldPassword);
		});

		it('выбрасывает ошибку 404, если пользователь не найден', async () => {
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(
				usersService.updateSupplierPassword(1, 'newpassword', 'oldpassword'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
		});
	});

	describe('Удаление поставщика', () => {
		it('успешно удаляет поставщика', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			PromotionsRepositoryMock.findAllPromotions = jest
				.fn()
				.mockResolvedValue({ items: [], total: 0 });
			usersRepository.updateUser = jest.fn().mockResolvedValue({
				...mockUser,
				isDeleted: true,
			});

			const result = await usersService.deleteSupplier(1);

			expect(result).toEqual({
				...mockUser,
				isDeleted: true,
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(PromotionsRepositoryMock.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					supplierId: 1,
					status: PromotionStatus.APPROVED,
					endDate: expect.any(Object),
					isDeleted: false,
				},
			});
			expect(usersRepository.updateUser).toHaveBeenCalledWith(1, { isDeleted: true });
		});

		it('успешно удаляет администратора', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockAdmin);
			PromotionsRepositoryMock.findAllPromotions = jest
				.fn()
				.mockResolvedValue({ items: [], total: 0 });
			usersRepository.updateUser = jest.fn().mockResolvedValue({
				...mockAdmin,
				isDeleted: true,
			});

			const result = await usersService.deleteSupplier(2);

			expect(result).toEqual({
				...mockAdmin,
				isDeleted: true,
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 2);
			expect(PromotionsRepositoryMock.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					supplierId: 2,
					status: PromotionStatus.APPROVED,
					endDate: expect.any(Object),
					isDeleted: false,
				},
			});
			expect(usersRepository.updateUser).toHaveBeenCalledWith(2, { isDeleted: true });
		});

		it('выбрасывает ошибку 422, если у поставщика есть активные акции', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			PromotionsRepositoryMock.findAllPromotions = jest
				.fn()
				.mockResolvedValue({ items: mockPromotions.items, total: 1 });
			usersRepository.updateUser = jest.fn();

			await expect(usersService.deleteSupplier(1)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.SUPPLIER_HAS_ACTIVE_PROMOTIONS),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(PromotionsRepositoryMock.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					supplierId: 1,
					status: PromotionStatus.APPROVED,
					endDate: expect.any(Object),
					isDeleted: false,
				},
			});
			expect(usersRepository.updateUser).not.toHaveBeenCalled();
		});
	});

	describe('Получение информации о пользователе', () => {
		it('возвращает информацию о пользователе по email', async () => {
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.getUserInfoByEmail('test@example.com');

			expect(result).toEqual(mockUser);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith(
				'email',
				'test@example.com',
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

	describe('Получение всех поставщиков', () => {
		it('возвращает список поставщиков с пагинацией', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			const paginatedResponse: PaginatedResponse<SupplierResponse> = {
				items: mockSuppliers,
				total: mockSuppliers.length,
				meta: {
					total: mockSuppliers.length,
					page: 1,
					limit: 10,
					totalPages: 1,
				},
			};
			usersRepository.findAllUsers = jest.fn().mockResolvedValue(paginatedResponse);

			const result = await usersService.getAllSuppliers({ pagination });

			expect(result).toEqual(paginatedResponse);
			expect(usersRepository.findAllUsers).toHaveBeenCalledWith({
				filters: { role: Role.SUPPLIER, isDeleted: false },
				pagination,
				orderBy: { createdAt: 'desc' },
			});
		});

		it('использует пагинацию по умолчанию, если параметры не указаны', async () => {
			const paginatedResponse: PaginatedResponse<SupplierResponse> = {
				items: mockSuppliers,
				total: mockSuppliers.length,
				meta: {
					total: mockSuppliers.length,
					page: 1,
					limit: 10,
					totalPages: 1,
				},
			};
			usersRepository.findAllUsers = jest.fn().mockResolvedValue(paginatedResponse);

			const result = await usersService.getAllSuppliers({});

			expect(result).toEqual(paginatedResponse);
			expect(usersRepository.findAllUsers).toHaveBeenCalledWith({
				filters: { role: Role.SUPPLIER, isDeleted: false },
				pagination: DEFAULT_PAGINATION,
				orderBy: { createdAt: 'desc' },
			});
		});
	});

	describe('Получение акций для пользователя', () => {
		it('успешно возвращает акции для пользователя с telegramId', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockUser);
			PromotionsRepositoryMock.findAllPromotions = jest.fn().mockResolvedValue(mockPromotions);

			const result = await usersService.getPromotionsForUser('123', pagination);

			expect(result).toEqual(mockPromotions);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('telegramId', '123');
			expect(PromotionsRepositoryMock.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					cityId: 1,
					status: PromotionStatus.APPROVED,
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

			await expect(usersService.getPromotionsForUser('123', pagination)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.CITY_NOT_SELECTED),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('telegramId', '123');
			expect(PromotionsRepositoryMock.findAllPromotions).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 422, если у пользователя не выбраны категории', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue({
				...mockUser,
				preferredCategories: [],
			});

			await expect(usersService.getPromotionsForUser('123', pagination)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.TELEGRAM_NO_CATEGORIES_SELECTED),
			);
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('telegramId', '123');
			expect(PromotionsRepositoryMock.findAllPromotions).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 400 для невалидного telegramId', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			await expect(usersService.getPromotionsForUser('invalid', pagination)).rejects.toThrowError(
				new HTTPError(400, MESSAGES.TELEGRAM_ID_NOT_FOUND),
			);
			expect(usersRepository.findUserByKeyOrThrow).not.toHaveBeenCalled();
		});

		it('выбрасывает ошибку 404, если пользователь не найден', async () => {
			const pagination: PaginationDto = DEFAULT_PAGINATION;
			usersRepository.findUserByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.getPromotionsForUser('123', pagination)).rejects.toThrowError(
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
		it('успешно обновляет профиль пользователя для администратора', async () => {
			const updateDto: UserUpdateProfileDto = {
				name: 'Новое Имя',
				cityId: 2,
				categoryIds: [3, 4],
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
			});
			PrismaServiceMock.validateCity = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.validateCategories = jest.fn().mockResolvedValue(undefined);

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
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 2);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(2);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([3, 4]);
			expect(usersRepository.updateUser).toHaveBeenCalledWith(2, {
				name: 'Новое Имя',
				cityId: 2,
				preferredCategories: { set: [{ id: 3 }, { id: 4 }] },
			});
		});

		it('успешно обновляет профиль пользователя для поставщика (собственный профиль)', async () => {
			const updateDto: UserUpdateProfileDto = {
				name: 'Новое Имя',
				cityId: 2,
				categoryIds: [3, 4],
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
			});
			PrismaServiceMock.validateCity = jest.fn().mockResolvedValue(undefined);
			PrismaServiceMock.validateCategories = jest.fn().mockResolvedValue(undefined);

			const result = await usersService.updateUserProfile(1, updateDto, {
				id: 1,
				role: Role.SUPPLIER,
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
			});
			expect(usersRepository.findUserByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(2);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([3, 4]);
			expect(usersRepository.updateUser).toHaveBeenCalledWith(1, {
				name: 'Новое Имя',
				cityId: 2,
				preferredCategories: { set: [{ id: 3 }, { id: 4 }] },
			});
		});

		it('выбрасывает ошибку 403, если поставщик пытается обновить чужой профиль', async () => {
			const updateDto: UserUpdateProfileDto = {
				name: 'Новое Имя',
			};
			usersRepository.findUserByKeyOrThrow = jest.fn().mockResolvedValue(mockAdmin);

			await expect(
				usersService.updateUserProfile(2, updateDto, { id: 1, role: Role.SUPPLIER }),
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
