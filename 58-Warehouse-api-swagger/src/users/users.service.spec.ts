import { Container } from 'inversify';
import { IConfigService } from '../config/config.service.interface';
import { IUsersRepository } from './users.repository.interface';
import { IUsersService } from './users.service.interface';
import { TYPES } from '../types';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Prisma, Role } from '@prisma/client';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
	find: jest.fn(),
	create: jest.fn(),
	findById: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
	findAllWarehouseManagers: jest.fn(),
};

const PrismaServiceMock = {
	client: {
		promotionModel: {
			findMany: jest.fn(),
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
		role: 'WAREHOUSE_MANAGER' as Role,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAdmin = {
		id: 2,
		email: 'admin@example.com',
		name: 'Admin User',
		password: 'hashed',
		role: 'ADMIN' as Role,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockSuperAdmin = {
		id: 3,
		email: 'superadmin@example.com',
		name: 'SuperAdmin User',
		password: 'hashed',
		role: 'SUPERADMIN' as Role,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Создание администратора', () => {
		it('Должен создать администратора с хэшированным паролем', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.find = jest.fn().mockResolvedValue(null);
			usersRepository.create = jest.fn().mockResolvedValue(mockAdmin);

			const result = await usersService.createAdmin({
				email: 'admin@example.com',
				name: 'Admin User',
				password: 'password123',
			});

			expect(result).toEqual(mockAdmin);
			expect(usersRepository.create).toHaveBeenCalled();
			const createCall = (usersRepository.create as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe('ADMIN');
		});

		it('Должен выбросить HTTPError, если администратор уже существует', async () => {
			usersRepository.find = jest.fn().mockResolvedValue(mockAdmin);

			await expect(
				usersService.createAdmin({
					email: 'admin@example.com',
					name: 'Admin User',
					password: 'password123',
				}),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.USER_ALREADY_EXISTS));
		});

		it('Должен обрабатывать ошибки базы данных', async () => {
			usersRepository.find = jest.fn().mockResolvedValue(null);
			usersRepository.create = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(
				usersService.createAdmin({
					email: 'admin@example.com',
					name: 'Admin User',
					password: 'password123',
				}),
			).rejects.toThrowError(new HTTPError(500, MESSAGES.SERVER_ERROR));
		});
	});

	describe('Создание начальника склада', () => {
		it('Должен создать начальника склада с хэшированным паролем', async () => {
			configService.get = jest.fn().mockReturnValue('10');
			usersRepository.find = jest.fn().mockResolvedValue(null);
			usersRepository.create = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.createWarehouseManager({
				email: 'test@example.com',
				name: 'Test User',
				password: 'password123',
			});

			expect(result).toEqual(mockUser);
			expect(usersRepository.create).toHaveBeenCalled();
			const createCall = (usersRepository.create as jest.Mock).mock.calls[0][0];
			expect(createCall.role).toBe('WAREHOUSE_MANAGER');
		});

		it('Должен выбросить HTTPError, если пользователь уже существует', async () => {
			usersRepository.find = jest.fn().mockResolvedValue(mockUser);

			await expect(
				usersService.createWarehouseManager({
					email: 'test@example.com',
					name: 'Test User',
					password: 'password123',
				}),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.USER_ALREADY_EXISTS));
		});

		it('Должен обрабатывать ошибки базы данных', async () => {
			usersRepository.find = jest.fn().mockResolvedValue(null);
			usersRepository.create = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(
				usersService.createWarehouseManager({
					email: 'test@example.com',
					name: 'Test User',
					password: 'password123',
				}),
			).rejects.toThrowError(new HTTPError(500, MESSAGES.SERVER_ERROR));
		});
	});

	describe('Валидация пользователя', () => {
		it('Должен подтвердить правильный пароль', async () => {
			const user = new User('test@example.com', 'Test User', 'WAREHOUSE_MANAGER');
			const salt = 10;
			await user.setPassword('password123', salt);

			usersRepository.find = jest.fn().mockResolvedValue({
				email: 'test@example.com',
				name: 'Test User',
				role: 'WAREHOUSE_MANAGER',
				password: user.password,
			});

			const result = await usersService.validateUser({
				email: 'test@example.com',
				password: 'password123',
			});

			expect(result).toBe(true);
		});

		it('Должен отклонить неверный пароль', async () => {
			const user = new User('test@example.com', 'Test User', 'WAREHOUSE_MANAGER');
			const salt = 10;
			await user.setPassword('password123', salt);

			usersRepository.find = jest.fn().mockResolvedValue({
				email: 'test@example.com',
				name: 'Test User',
				role: 'WAREHOUSE_MANAGER',
				password: user.password,
			});

			const result = await usersService.validateUser({
				email: 'test@example.com',
				password: 'wrongpassword',
			});

			expect(result).toBe(false);
		});

		it('Должен вернуть false, если пользователь не найден', async () => {
			usersRepository.find = jest.fn().mockResolvedValue(null);

			const result = await usersService.validateUser({
				email: 'nonexistent@example.com',
				password: 'password123',
			});

			expect(result).toBe(false);
		});
	});

	describe('Обновление пароля начальника склада', () => {
		it('Должен успешно обновить пароль', async () => {
			usersRepository.findById = jest.fn().mockResolvedValue(mockUser);
			usersRepository.update = jest.fn().mockResolvedValue({
				...mockUser,
				password: 'newhashed',
			});
			configService.get = jest.fn().mockReturnValue('10');

			const result = await usersService.updateWarehouseManagerPassword(1, 'newpassword');

			expect(result.password).toBe('newhashed');
			expect(usersRepository.update).toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если пользователь не найден', async () => {
			usersRepository.findById = jest.fn().mockResolvedValue(null);

			await expect(
				usersService.updateWarehouseManagerPassword(1, 'newpassword'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
		});

		it('Должен выбросить HTTPError, если пользователь не является начальником склада', async () => {
			usersRepository.findById = jest.fn().mockResolvedValue(mockAdmin);

			await expect(
				usersService.updateWarehouseManagerPassword(2, 'newpassword'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
		});

		it('Должен обрабатывать ошибки Prisma', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2025',
				clientVersion: '1.0',
			});
			usersRepository.findById = jest.fn().mockResolvedValue(mockUser);
			usersRepository.update = jest.fn().mockRejectedValue(prismaError);

			await expect(
				usersService.updateWarehouseManagerPassword(1, 'newpassword'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
		});
	});

	describe('Удаление начальника склада', () => {
		it('Должен успешно удалить начальника склада', async () => {
			usersRepository.findById = jest.fn().mockResolvedValue(mockUser);
			PrismaServiceMock.client.promotionModel.findMany = jest.fn().mockResolvedValue([]);
			usersRepository.delete = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.deleteWarehouseManager(1);

			expect(result).toEqual(mockUser);
			expect(usersRepository.delete).toHaveBeenCalledWith(1);
		});

		it('Должен выбросить HTTPError, если пользователь не найден', async () => {
			usersRepository.findById = jest.fn().mockResolvedValue(null);

			await expect(usersService.deleteWarehouseManager(1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
		});

		it('Должен выбросить HTTPError, если пользователь не является начальником склада', async () => {
			usersRepository.findById = jest.fn().mockResolvedValue(mockAdmin);

			await expect(usersService.deleteWarehouseManager(2)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
		});

		it('Должен обрабатывать ошибки Prisma', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2025',
				clientVersion: '1.0',
			});
			usersRepository.findById = jest.fn().mockResolvedValue(mockUser);
			PrismaServiceMock.client.promotionModel.findMany = jest.fn().mockResolvedValue([]);
			usersRepository.delete = jest.fn().mockRejectedValue(prismaError);

			await expect(usersService.deleteWarehouseManager(1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
		});
	});

	describe('Получение информации о пользователе', () => {
		it('Должен вернуть информацию о пользователе', async () => {
			usersRepository.find = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.getUserInfo('test@example.com');

			expect(result).toEqual(mockUser);
		});

		it('Должен вернуть null, если пользователь не найден', async () => {
			usersRepository.find = jest.fn().mockResolvedValue(null);

			const result = await usersService.getUserInfo('nonexistent@example.com');

			expect(result).toBeNull();
		});
	});

	describe('Получение информации о пользователе по ID', () => {
		it('Должен вернуть информацию о пользователе по ID', async () => {
			usersRepository.findById = jest.fn().mockResolvedValue(mockUser);

			const result = await usersService.getUserInfoById(1);

			expect(result).toEqual(mockUser);
			expect(usersRepository.findById).toHaveBeenCalledWith(1);
		});

		it('Должен вернуть null, если пользователь не найден', async () => {
			usersRepository.findById = jest.fn().mockResolvedValue(null);

			const result = await usersService.getUserInfoById(999);

			expect(result).toBeNull();
			expect(usersRepository.findById).toHaveBeenCalledWith(999);
		});

		it('Должен обрабатывать ошибки базы данных', async () => {
			usersRepository.findById = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(usersService.getUserInfoById(1)).rejects.toThrowError(
				new HTTPError(500, MESSAGES.SERVER_ERROR),
			);
			expect(usersRepository.findById).toHaveBeenCalledWith(1);
		});
	});
});
