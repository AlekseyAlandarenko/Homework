import { Container } from 'inversify';
import { IConfigService } from '../config/config.service.interface';
import { IUsersRepository } from './users.repository.interface';
import { IUsersService } from './users.service.interface';
import { TYPES } from '../types';
import { UsersService } from './users.service';
import { User } from './user.entity';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { SupplierResponse } from './users.repository.interface';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DEFAULT_PAGINATION } from '../common/constants';

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
	createUser: jest.fn(),
	findByEmail: jest.fn(),
	findByEmailOrThrow: jest.fn(),
	findById: jest.fn(),
	findByIdOrThrow: jest.fn(),
	findAllSuppliers: jest.fn(),
	updateUser: jest.fn(),
	deleteUser: jest.fn(),
	findByTelegramId: jest.fn(),
};

const PrismaServiceMock = {
	client: {
		promotionModel: {
			count: jest.fn(),
		},
	},
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

	configService = container.get<IConfigService>(TYPES.ConfigService);
	usersRepository = container.get<IUsersRepository>(TYPES.UsersRepository);
	usersService = container.get<IUsersService>(TYPES.UsersService);
});

describe('Сервис пользователей', () => {
	const mockUser = {
		id: 1,
		email: 'test@example.com',
		name: 'Test User',
		password: 'hashed',
		role: 'SUPPLIER',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAdmin = {
		id: 2,
		email: 'admin@example.com',
		name: 'Admin User',
		password: 'hashed',
		role: 'ADMIN',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockSuperAdmin = {
		id: 3,
		email: 'superadmin@example.com',
		name: 'SuperAdmin User',
		password: 'hashed',
		role: 'SUPERADMIN',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockSuppliers: SupplierResponse[] = [
		{
			id: 1,
			email: 'test@example.com',
			name: 'Test User',
			role: 'SUPPLIER',
			createdAt: new Date(),
			updatedAt: new Date(),
			telegramId: null,
		},
		{
			id: 4,
			email: 'supplier2@example.com',
			name: 'Supplier 2',
			role: 'SUPPLIER',
			createdAt: new Date(),
			updatedAt: new Date(),
			telegramId: null,
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Создание администратора', () => {
		it('Должен создать администратора с хэшированным паролем', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.findByEmail = jest.fn().mockResolvedValue(null);
			usersRepository.createUser = jest.fn().mockResolvedValue(mockAdmin);

			const result = await usersService.createUser(
				{
					email: 'admin@example.com',
					name: 'Admin User',
					password: 'password123',
				},
				'ADMIN',
			);

			expect(result).toEqual(mockAdmin);
			expect(usersRepository.createUser).toHaveBeenCalled();
			const createCall = (usersRepository.createUser as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe('ADMIN');
			expect(createCall.password).not.toBe('password123');
		});

		it('Должен выбросить ошибку 422, если администратор уже существует', async () => {
			usersRepository.findByEmail = jest.fn().mockResolvedValue(mockAdmin);

			await expect(
				usersService.createUser(
					{
						email: 'admin@example.com',
						name: 'Admin User',
						password: 'password123',
					},
					'ADMIN',
				),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.USER_ALREADY_EXISTS));
		});
	});

	describe('Создание поставщика', () => {
		it('Должен создать поставщика с хэшированным паролем', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.findByEmail = jest.fn().mockResolvedValue(null);
			usersRepository.createUser = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.createUser(
				{
					email: 'test@example.com',
					name: 'Test User',
					password: 'password123',
				},
				'SUPPLIER',
			);

			expect(result).toEqual(mockUser);
			expect(usersRepository.createUser).toHaveBeenCalled();
			const createCall = (usersRepository.createUser as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe('SUPPLIER');
			expect(createCall.password).not.toBe('password123');
		});

		it('Должен выбросить ошибку 422, если пользователь уже существует', async () => {
			usersRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);

			await expect(
				usersService.createUser(
					{
						email: 'test@example.com',
						name: 'Test User',
						password: 'password123',
					},
					'SUPPLIER',
				),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.USER_ALREADY_EXISTS));
		});
	});

	describe('Аутентификация пользователя', () => {
		it('Должен успешно аутентифицировать с правильным паролем', async () => {
			const user = new User('test@example.com', 'Test User', 'SUPPLIER');
			const salt = 10;
			await user.setPassword('password123', salt);
			usersRepository.findByEmail = jest.fn().mockResolvedValue({
				email: 'test@example.com',
				name: 'Test User',
				role: 'SUPPLIER',
				password: user.password,
			});
			configService.get = jest.fn().mockReturnValue('secret');

			const result = await usersService.login({
				email: 'test@example.com',
				password: 'password123',
			});

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
			expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
		});

		it('Должен выбросить ошибку 401, если пароль неверный', async () => {
			const user = new User('test@example.com', 'Test User', 'SUPPLIER');
			const salt = 10;
			await user.setPassword('password123', salt);
			usersRepository.findByEmail = jest.fn().mockResolvedValue({
				email: 'test@example.com',
				name: 'Test User',
				role: 'SUPPLIER',
				password: user.password,
			});

			await expect(
				usersService.login({
					email: 'test@example.com',
					password: 'wrongpassword',
				}),
			).rejects.toThrowError(new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login'));
		});

		it('Должен выбросить ошибку 401, если пользователь не найден', async () => {
			usersRepository.findByEmail = jest.fn().mockResolvedValue(null);

			await expect(
				usersService.login({
					email: 'nonexistent@example.com',
					password: 'password123',
				}),
			).rejects.toThrowError(new HTTPError(401, MESSAGES.INVALID_CREDENTIALS, 'login'));
		});
	});

	describe('Обновление пароля поставщика', () => {
		it('Должен успешно обновить пароль', async () => {
			usersRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockUser);
			usersRepository.updateUser = jest.fn().mockResolvedValue({
				...mockUser,
				password: 'newhashed',
			});
			configService.get = jest.fn().mockReturnValue('10');

			const result = await usersService.updateSupplierPassword(1, 'newpassword');

			expect(result.password).toBe('newhashed');
			expect(usersRepository.updateUser).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ password: expect.any(String) }),
			);
		});

		it('Должен выбросить ошибку 404, если пользователь не найден', async () => {
			usersRepository.findByIdOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.updateSupplierPassword(1, 'newpassword')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
		});

		it('Должен выбросить ошибку 403, если пользователь не является поставщиком', async () => {
			usersRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockAdmin);
			await expect(usersService.updateSupplierPassword(2, 'newpassword')).rejects.toThrowError(
				new HTTPError(403, MESSAGES.INVALID_ROLE.replace('{{role}}', 'ADMIN')),
			);
		});
	});

	describe('Удаление поставщика', () => {
		it('Должен успешно удалить поставщика', async () => {
			usersRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockUser);
			PrismaServiceMock.client.promotionModel.count = jest.fn().mockResolvedValue(0);
			usersRepository.deleteUser = jest.fn().mockResolvedValue(mockUser);
			const result = await usersService.deleteSupplier(1);
			expect(result).toEqual(mockUser);
			expect(usersRepository.deleteUser).toHaveBeenCalledWith(1);
		});

		it('Должен выбросить ошибку 404, если пользователь не найден', async () => {
			usersRepository.findByIdOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			await expect(usersService.deleteSupplier(1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
		});

		it('Должен выбросить ошибку 403, если пользователь не является поставщиком', async () => {
			usersRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockAdmin);
			await expect(usersService.deleteSupplier(2)).rejects.toThrowError(
				new HTTPError(403, MESSAGES.INVALID_ROLE.replace('{{role}}', 'ADMIN')),
			);
		});

		it('Должен выбросить ошибку 400, если у поставщика есть активные акции', async () => {
			usersRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockUser);
			PrismaServiceMock.client.promotionModel.count = jest.fn().mockResolvedValue(1);
			await expect(usersService.deleteSupplier(1)).rejects.toThrowError(
				new HTTPError(400, MESSAGES.SUPPLIER_HAS_ACTIVE_PROMOTIONS),
			);
			expect(usersRepository.deleteUser).not.toHaveBeenCalled();
		});
	});

	describe('Получение информации о пользователе', () => {
		it('Должен вернуть информацию о пользователе', async () => {
			usersRepository.findByEmailOrThrow = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.getUserInfoByEmail('test@example.com');

			expect(result).toEqual(mockUser);
			expect(usersRepository.findByEmailOrThrow).toHaveBeenCalledWith('test@example.com');
		});

		it('Должен выбросить ошибку 404, если пользователь не найден', async () => {
			usersRepository.findByEmailOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.getUserInfoByEmail('nonexistent@example.com')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
		});
	});

	describe('Получение информации о пользователе по ID', () => {
		it('Должен вернуть информацию о пользователе по ID', async () => {
			usersRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.getUserInfoById(1);

			expect(result).toEqual(mockUser);
			expect(usersRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
		});

		it('Должен выбросить ошибку 404, если пользователь не найден', async () => {
			usersRepository.findByIdOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(usersService.getUserInfoById(999)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
		});

		it('Должен выбросить ошибку 422, если ID невалиден', async () => {
			await expect(usersService.getUserInfoById(0)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INVALID_ID),
			);
			await expect(usersService.getUserInfoById(NaN)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INVALID_ID),
			);
		});
	});

	describe('Получение всех поставщиков', () => {
		it('Должен вернуть список поставщиков с пагинацией', async () => {
			const pagination: PaginationDto = { page: 1, limit: 10 };
			const paginatedResponse: PaginatedResponse<SupplierResponse> = {
				items: mockSuppliers,
				total: mockSuppliers.length,
			};
			usersRepository.findAllSuppliers = jest.fn().mockResolvedValue(paginatedResponse);

			const result = await usersService.getAllSuppliers(pagination);

			expect(result).toEqual(paginatedResponse);
			expect(usersRepository.findAllSuppliers).toHaveBeenCalledWith(pagination);
		});

		it('Должен использовать пагинацию по умолчанию, если параметры не указаны', async () => {
			const paginatedResponse: PaginatedResponse<SupplierResponse> = {
				items: mockSuppliers,
				total: mockSuppliers.length,
			};
			usersRepository.findAllSuppliers = jest.fn().mockResolvedValue(paginatedResponse);

			const result = await usersService.getAllSuppliers();

			expect(result).toEqual(paginatedResponse);
			expect(usersRepository.findAllSuppliers).toHaveBeenCalledWith(DEFAULT_PAGINATION);
		});
	});
});