import { Container } from 'inversify';
import { IPromotionsRepository } from './promotions.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { IPromotionsService } from './promotions.service.interface';
import { TYPES } from '../types';
import { PromotionsService } from './promotions.service';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { Promotion } from './promotion.entity';
import { Prisma } from '@prisma/client';
import { DEFAULT_PAGINATION } from '../common/constants';
import { PromotionStatus } from '../common/enums/promotion-status.enum';
import { Role } from '../common/enums/role.enum';

const PrismaServiceMock = {
	count: jest.fn(),
	findUnique: jest.fn(),
	validateCity: jest.fn(),
	validateCategories: jest.fn(),
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

const UsersServiceMock: IUsersService = {
	createUser: jest.fn(),
	createTelegramUser: jest.fn(),
	getUserInfoByEmail: jest.fn(),
	getUserInfoById: jest.fn(),
	getUserInfoByTelegramId: jest.fn(),
	getAllSuppliers: jest.fn(),
	getPromotionsForUser: jest.fn(),
	updateSupplierPassword: jest.fn(),
	updateUserTelegramId: jest.fn(),
	updateUserProfile: jest.fn(),
	updateUserCategories: jest.fn(),
	deleteSupplier: jest.fn(),
	login: jest.fn(),
};

const container = new Container();
let promotionsRepository: IPromotionsRepository;
let usersService: IUsersService;
let promotionsService: IPromotionsService;

beforeAll(() => {
	container.bind<IPromotionsService>(TYPES.PromotionsService).to(PromotionsService);
	container
		.bind<IPromotionsRepository>(TYPES.PromotionsRepository)
		.toConstantValue(PromotionsRepositoryMock);
	container.bind<IUsersService>(TYPES.UsersService).toConstantValue(UsersServiceMock);
	container.bind(TYPES.PrismaService).toConstantValue(PrismaServiceMock);

	promotionsRepository = container.get<IPromotionsRepository>(TYPES.PromotionsRepository);
	usersService = container.get<IUsersService>(TYPES.UsersService);
	promotionsService = container.get<IPromotionsService>(TYPES.PromotionsService);
});

describe('Сервис акций', () => {
	const getFutureDate = (daysFromNow: number): Date => {
		const date = new Date();
		date.setDate(date.getDate() + daysFromNow);
		return date;
	};

	const getPastDate = (daysAgo: number): Date => {
		const date = new Date();
		date.setDate(date.getDate() - daysAgo);
		return date;
	};

	const mockPromotion = {
		id: 1,
		title: 'Тестовая Акция',
		description: 'Тестовое Описание Достаточной Длины',
		startDate: getFutureDate(1),
		endDate: getFutureDate(7),
		status: PromotionStatus.PENDING,
		supplierId: 1,
		isDeleted: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockActivePromotion = {
		id: 2,
		title: 'Активная Акция',
		description: 'Активное Описание Достаточной Длины',
		startDate: getPastDate(1),
		endDate: getFutureDate(1),
		status: PromotionStatus.APPROVED,
		supplierId: 1,
		isDeleted: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockUser = {
		id: 1,
		email: 'test@example.com',
		name: 'Тестовый Поставщик',
		role: Role.SUPPLIER,
		password: 'hashed',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAdmin = {
		id: 2,
		email: 'admin@example.com',
		name: 'Админ Пользователь',
		role: Role.ADMIN,
		password: '',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockUserWithCategories = {
		...mockUser,
		cityId: 1,
		preferredCategories: [{ id: 1, name: 'Еда' }],
	};

	const mockPromotionWithRelations = {
		...mockPromotion,
		categories: [{ id: 1, name: 'Еда' }],
		city: { id: 1, name: 'Москва' },
	};

	beforeEach(() => {
		jest.clearAllMocks();
		PrismaServiceMock.validateCity.mockResolvedValue(undefined);
		PrismaServiceMock.validateCategories.mockResolvedValue(undefined);
		PrismaServiceMock.findUnique.mockResolvedValue(null);
		PrismaServiceMock.count.mockResolvedValue(0);
	});

	describe('Создание акции', () => {
		it('Должен успешно создать акцию', async () => {
			usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.findPromotionByKey = jest.fn().mockResolvedValue(null);
			promotionsRepository.createPromotion = jest.fn().mockResolvedValue(mockPromotion);

			const result = await promotionsService.createPromotion({
				title: 'Тестовая Акция',
				description: 'Тестовое Описание Достаточной Длины',
				startDate: mockPromotion.startDate.toISOString(),
				endDate: mockPromotion.endDate.toISOString(),
				supplierId: 1,
				status: PromotionStatus.PENDING,
			});

			expect(result).toEqual(mockPromotion);
			expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
			expect(promotionsRepository.findPromotionByKey).toHaveBeenCalledWith(
				'title',
				'Тестовая Акция',
			);
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Тестовая Акция',
					description: 'Тестовое Описание Достаточной Длины',
					startDate: mockPromotion.startDate,
					endDate: mockPromotion.endDate,
					status: PromotionStatus.PENDING,
					supplierId: 1,
					isDeleted: false,
				}),
			);
		});

		it('Должен успешно создать акцию с минимальным заголовком', async () => {
			usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.findPromotionByKey = jest.fn().mockResolvedValue(null);
			const shortTitlePromotion = {
				...mockPromotion,
				title: 'Т',
			};
			promotionsRepository.createPromotion = jest.fn().mockResolvedValue(shortTitlePromotion);

			const result = await promotionsService.createPromotion({
				title: 'Т',
				description: 'Тестовое Описание Достаточной Длины',
				startDate: mockPromotion.startDate.toISOString(),
				endDate: mockPromotion.endDate.toISOString(),
				supplierId: 1,
				status: PromotionStatus.PENDING,
			});

			expect(result).toEqual(shortTitlePromotion);
			expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
			expect(promotionsRepository.findPromotionByKey).toHaveBeenCalledWith('title', 'Т');
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Т',
					isDeleted: false,
				}),
			);
		});

		it('Должен успешно создать акцию с минимальным описанием', async () => {
			usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.findPromotionByKey = jest.fn().mockResolvedValue(null);
			const shortDescPromotion = {
				...mockPromotion,
				description: 'Короткое',
			};
			promotionsRepository.createPromotion = jest.fn().mockResolvedValue(shortDescPromotion);

			const result = await promotionsService.createPromotion({
				title: 'Тестовая Акция',
				description: 'Короткое',
				startDate: mockPromotion.startDate.toISOString(),
				endDate: mockPromotion.endDate.toISOString(),
				supplierId: 1,
				status: PromotionStatus.PENDING,
			});

			expect(result).toEqual(shortDescPromotion);
			expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
			expect(promotionsRepository.findPromotionByKey).toHaveBeenCalledWith(
				'title',
				'Тестовая Акция',
			);
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(
				expect.objectContaining({
					description: 'Короткое',
					isDeleted: false,
				}),
			);
		});

		it('Должен выбросить ошибку 404, если поставщик не найден', async () => {
			usersService.getUserInfoById = jest.fn().mockResolvedValue(null);
			promotionsRepository.findPromotionByKey = jest.fn().mockResolvedValue(null);

			await expect(
				promotionsService.createPromotion({
					title: 'Тестовая Акция',
					description: 'Тестовое Описание Достаточной Длины',
					startDate: mockPromotion.startDate.toISOString(),
					endDate: mockPromotion.endDate.toISOString(),
					supplierId: 999,
					status: PromotionStatus.PENDING,
				}),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.SUPPLIER_NOT_FOUND));
			expect(usersService.getUserInfoById).toHaveBeenCalledWith(999);
			expect(promotionsRepository.findPromotionByKey).not.toHaveBeenCalled();
			expect(promotionsRepository.createPromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 403, если пользователь не является поставщиком', async () => {
			usersService.getUserInfoById = jest.fn().mockResolvedValue(mockAdmin);
			promotionsRepository.findPromotionByKey = jest.fn().mockResolvedValue(null);

			await expect(
				promotionsService.createPromotion({
					title: 'Тестовая Акция',
					description: 'Тестовое Описание Достаточной Длины',
					startDate: mockPromotion.startDate.toISOString(),
					endDate: mockPromotion.endDate.toISOString(),
					supplierId: 2,
					status: PromotionStatus.PENDING,
				}),
			).rejects.toThrowError(new HTTPError(403, MESSAGES.INVALID_SUPPLIER_ROLE));
			expect(usersService.getUserInfoById).toHaveBeenCalledWith(2);
			expect(promotionsRepository.findPromotionByKey).not.toHaveBeenCalled();
			expect(promotionsRepository.createPromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 409, если акция с таким заголовком уже существует', async () => {
			usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.findPromotionByKey = jest.fn().mockResolvedValue(mockPromotion);

			await expect(
				promotionsService.createPromotion({
					title: 'Тестовая Акция',
					description: 'Тестовое Описание Достаточной Длины',
					startDate: mockPromotion.startDate.toISOString(),
					endDate: mockPromotion.endDate.toISOString(),
					supplierId: 1,
					status: PromotionStatus.PENDING,
				}),
			).rejects.toThrowError(new HTTPError(409, MESSAGES.PROMOTION_TITLE_ALREADY_EXISTS));
			expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
			expect(promotionsRepository.findPromotionByKey).toHaveBeenCalledWith(
				'title',
				'Тестовая Акция',
			);
			expect(promotionsRepository.createPromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.findPromotionByKey = jest.fn().mockResolvedValue(null);
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '',
			});
			promotionsRepository.createPromotion = jest.fn().mockRejectedValue(prismaError);

			await expect(
				promotionsService.createPromotion({
					title: 'Тестовая Акция',
					description: 'Тестовое Описание Достаточной Длины',
					startDate: mockPromotion.startDate.toISOString(),
					endDate: mockPromotion.endDate.toISOString(),
					supplierId: 1,
					status: PromotionStatus.PENDING,
				}),
			).rejects.toThrowError(prismaError);
			expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
			expect(promotionsRepository.findPromotionByKey).toHaveBeenCalledWith(
				'title',
				'Тестовая Акция',
			);
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(expect.any(Promotion));
		});
	});

	describe('Обновление акции', () => {
		it('Должен успешно обновить акцию', async () => {
			const updatedPromotion = {
				...mockPromotion,
				title: 'Обновленная Акция',
			};
			promotionsRepository.findPromotionByKeyOrThrow = jest.fn().mockResolvedValue(undefined);
			promotionsRepository.updatePromotion = jest.fn().mockResolvedValue(updatedPromotion);

			const result = await promotionsService.updatePromotion(1, {
				title: 'Обновленная Акция',
			});

			expect(result).toEqual(updatedPromotion);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, {
				title: 'Обновленная Акция',
			});
		});

		it('Должен успешно обновить описание акции', async () => {
			const updatedPromotion = {
				...mockPromotion,
				description: 'Обновленное Описание Достаточной Длины',
			};
			promotionsRepository.findPromotionByKeyOrThrow = jest.fn().mockResolvedValue(undefined);
			promotionsRepository.updatePromotion = jest.fn().mockResolvedValue(updatedPromotion);

			const result = await promotionsService.updatePromotion(1, {
				description: 'Обновленное Описание Достаточной Длины',
			});

			expect(result).toEqual(updatedPromotion);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, {
				description: 'Обновленное Описание Достаточной Длины',
			});
		});

		it('Должен выбросить ошибку 404, если акция не найдена', async () => {
			promotionsRepository.findPromotionByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(
				promotionsService.updatePromotion(999, { title: 'Обновленная Акция' }),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.updatePromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			promotionsRepository.findPromotionByKeyOrThrow = jest.fn().mockResolvedValue(undefined);
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '',
			});
			promotionsRepository.updatePromotion = jest.fn().mockRejectedValue(prismaError);

			await expect(
				promotionsService.updatePromotion(1, { title: 'Обновленная Акция' }),
			).rejects.toThrowError(prismaError);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, {
				title: 'Обновленная Акция',
			});
		});
	});

	describe('Обновление статуса акции', () => {
		it('Должен успешно обновить статус акции', async () => {
			const updatedPromotion = {
				...mockPromotion,
				status: PromotionStatus.APPROVED,
			};
			promotionsRepository.findPromotionByKeyOrThrow = jest.fn().mockResolvedValue(undefined);
			promotionsRepository.updatePromotion = jest.fn().mockResolvedValue(updatedPromotion);

			const result = await promotionsService.updatePromotionStatus(1, PromotionStatus.APPROVED);

			expect(result).toEqual(updatedPromotion);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, {
				status: PromotionStatus.APPROVED,
			});
		});

		it('Должен выбросить ошибку 404, если акция не найдена', async () => {
			promotionsRepository.findPromotionByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(
				promotionsService.updatePromotionStatus(999, PromotionStatus.APPROVED),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
		});
	});

	describe('Удаление акции', () => {
		it('Должно успешно выполнить мягкое удаление неактивной акции', async () => {
			const deletedPromotion = {
				...mockPromotion,
				isDeleted: true,
			};
			promotionsRepository.findPromotionByKeyOrThrow = jest.fn().mockResolvedValue(mockPromotion);
			promotionsRepository.deletePromotion = jest.fn().mockResolvedValue(deletedPromotion);

			const result = await promotionsService.deletePromotion(1);

			expect(result).toEqual(deletedPromotion);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.deletePromotion).toHaveBeenCalledWith(1);
			expect(result.isDeleted).toBe(true);
		});

		it('Должен выбросить ошибку 422, если акция активна', async () => {
			promotionsRepository.findPromotionByKeyOrThrow = jest
				.fn()
				.mockResolvedValue(mockActivePromotion);

			await expect(promotionsService.deletePromotion(2)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.CANNOT_DELETE_ACTIVE_PROMOTION),
			);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				2,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.deletePromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если акция не найдена', async () => {
			promotionsRepository.findPromotionByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(promotionsService.deletePromotion(999)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
			);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.deletePromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			promotionsRepository.findPromotionByKeyOrThrow = jest.fn().mockResolvedValue(mockPromotion);
			promotionsRepository.deletePromotion = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(promotionsService.deletePromotion(1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
			);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
			expect(promotionsRepository.deletePromotion).toHaveBeenCalledWith(1);
		});
	});

	describe('Получение всех акций', () => {
		it('Должен получить акции с фильтрами, исключая удалённые', async () => {
			promotionsRepository.findAllPromotions = jest.fn().mockResolvedValue({
				items: [mockPromotion],
				total: 1,
			});

			const result = await promotionsService.getAllPromotions({
				filters: {
					active: true,
					sortBy: 'title',
					sortOrder: 'asc',
				},
				pagination: DEFAULT_PAGINATION,
			});

			expect(result).toEqual({ items: [mockPromotion], total: 1 });
			expect(promotionsRepository.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					isDeleted: false,
					AND: [
						{ startDate: { lte: expect.any(Date) } },
						{ endDate: { gte: expect.any(Date) } },
						{ status: PromotionStatus.APPROVED },
					],
				},
				orderBy: { title: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен получить акции с значениями по умолчанию, исключая удалённые', async () => {
			promotionsRepository.findAllPromotions = jest.fn().mockResolvedValue({
				items: [mockPromotion],
				total: 1,
			});

			const result = await promotionsService.getAllPromotions({});

			expect(result).toEqual({ items: [mockPromotion], total: 1 });
			expect(promotionsRepository.findAllPromotions).toHaveBeenCalledWith({
				filters: { isDeleted: false },
				orderBy: { createdAt: 'desc' },
				pagination: DEFAULT_PAGINATION,
			});
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен корректно обрабатывать параметры сортировки через filters', async () => {
			promotionsRepository.findAllPromotions = jest.fn().mockResolvedValue({
				items: [mockPromotion],
				total: 1,
			});

			const result = await promotionsService.getAllPromotions({
				filters: { sortBy: 'title', sortOrder: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});

			expect(result).toEqual({ items: [mockPromotion], total: 1 });
			expect(promotionsRepository.findAllPromotions).toHaveBeenCalledWith({
				filters: { isDeleted: false },
				orderBy: { title: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			promotionsRepository.findAllPromotions = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(promotionsService.getAllPromotions({})).rejects.toThrowError('DB Error');
			expect(promotionsRepository.findAllPromotions).toHaveBeenCalledWith({
				filters: { isDeleted: false },
				orderBy: { createdAt: 'desc' },
				pagination: DEFAULT_PAGINATION,
			});
		});
	});

	describe('Получение акций по поставщику', () => {
		it('Должен получить акции для поставщика, исключая удаленные', async () => {
			promotionsRepository.findPromotionsBySupplier = jest.fn().mockResolvedValue({
				items: [mockPromotion],
				total: 1,
			});

			const result = await promotionsService.getPromotionsBySupplier(1, DEFAULT_PAGINATION);

			expect(result).toEqual({ items: [mockPromotion], total: 1 });
			expect(promotionsRepository.findPromotionsBySupplier).toHaveBeenCalledWith(
				1,
				DEFAULT_PAGINATION,
			);
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			promotionsRepository.findPromotionsBySupplier = jest
				.fn()
				.mockRejectedValue(new Error('DB Error'));

			await expect(
				promotionsService.getPromotionsBySupplier(1, DEFAULT_PAGINATION),
			).rejects.toThrowError('DB Error');
			expect(promotionsRepository.findPromotionsBySupplier).toHaveBeenCalledWith(
				1,
				DEFAULT_PAGINATION,
			);
		});
	});

	describe('Получение акции по ID', () => {
		it('Должен успешно получить акцию для администратора', async () => {
			const mockPromotionWithRelations = {
				...mockPromotion,
				categories: [{ id: 1, name: 'Еда' }],
				city: { id: 1, name: 'Москва' },
			};
			promotionsRepository.findPromotionByKeyOrThrow = jest
				.fn()
				.mockResolvedValue(mockPromotionWithRelations);

			const result = await promotionsService.getPromotionById(1, 2, Role.ADMIN);

			expect(result).toEqual(mockPromotionWithRelations);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
		});

		it('Должен успешно получить акцию для поставщика, если акция принадлежит ему', async () => {
			const mockPromotionWithRelations = {
				...mockPromotion,
				categories: [{ id: 1, name: 'Еда' }],
				city: { id: 1, name: 'Москва' },
			};
			promotionsRepository.findPromotionByKeyOrThrow = jest
				.fn()
				.mockResolvedValue(mockPromotionWithRelations);

			const result = await promotionsService.getPromotionById(1, 1, Role.SUPPLIER);

			expect(result).toEqual(mockPromotionWithRelations);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				1,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
		});

		it('Должен выбросить ошибку 403, если поставщик пытается получить чужую акцию', async () => {
			const mockPromotionWithRelations = {
				...mockPromotion,
				supplierId: 2,
				categories: [{ id: 1, name: 'Еда' }],
				city: { id: 1, name: 'Москва' },
			};
			promotionsRepository.findPromotionByKeyOrThrow = jest
				.fn()
				.mockResolvedValue(mockPromotionWithRelations);

			await expect(promotionsService.getPromotionById(1, 1, Role.SUPPLIER)).rejects.toThrowError(
				new HTTPError(403, MESSAGES.FORBIDDEN_ACCESS_TO_PROMOTION),
			);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				1,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
		});

		it('Должен выбросить ошибку 404, если акция не найдена', async () => {
			promotionsRepository.findPromotionByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(promotionsService.getPromotionById(999, 2, Role.ADMIN)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
			);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			promotionsRepository.findPromotionByKeyOrThrow = jest.fn().mockRejectedValue(prismaError);

			await expect(promotionsService.getPromotionById(1, 2, Role.ADMIN)).rejects.toThrowError(
				prismaError,
			);
			expect(promotionsRepository.findPromotionByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PROMOTION_NOT_FOUND,
			);
		});
	});

	describe('Получение акций для пользователя по Telegram ID', () => {
		it('Должен успешно получить акции для пользователя', async () => {
			usersService.getUserInfoByTelegramId = jest.fn().mockResolvedValue(mockUserWithCategories);
			promotionsRepository.findAllPromotions = jest.fn().mockResolvedValue({
				items: [mockPromotionWithRelations],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});

			const result = await promotionsService.getPromotionsForUser('12345', DEFAULT_PAGINATION);

			expect(result).toEqual({
				items: [mockPromotionWithRelations],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});
			expect(usersService.getUserInfoByTelegramId).toHaveBeenCalledWith('12345');
			expect(promotionsRepository.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					cityId: 1,
					isDeleted: false,
					status: PromotionStatus.APPROVED,
					startDate: { lte: expect.any(Date) },
					endDate: { gte: expect.any(Date) },
					categories: { some: { id: { in: [1] } } },
				},
				pagination: DEFAULT_PAGINATION,
				orderBy: { startDate: 'asc' },
			});
		});

		it('Должен вернуть пустой список, если подходящих акций нет', async () => {
			usersService.getUserInfoByTelegramId = jest.fn().mockResolvedValue(mockUserWithCategories);
			promotionsRepository.findAllPromotions = jest.fn().mockResolvedValue({
				items: [],
				total: 0,
				meta: {
					total: 0,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 0,
				},
			});

			const result = await promotionsService.getPromotionsForUser('12345', DEFAULT_PAGINATION);

			expect(result).toEqual({
				items: [],
				total: 0,
				meta: {
					total: 0,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 0,
				},
			});
			expect(usersService.getUserInfoByTelegramId).toHaveBeenCalledWith('12345');
			expect(promotionsRepository.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					cityId: 1,
					isDeleted: false,
					status: PromotionStatus.APPROVED,
					startDate: { lte: expect.any(Date) },
					endDate: { gte: expect.any(Date) },
					categories: { some: { id: { in: [1] } } },
				},
				pagination: DEFAULT_PAGINATION,
				orderBy: { startDate: 'asc' },
			});
		});

		it('Должен выбросить ошибку 404, если пользователь не найден', async () => {
			usersService.getUserInfoByTelegramId = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(
				promotionsService.getPromotionsForUser('12345', DEFAULT_PAGINATION),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(usersService.getUserInfoByTelegramId).toHaveBeenCalledWith('12345');
			expect(promotionsRepository.findAllPromotions).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			usersService.getUserInfoByTelegramId = jest.fn().mockResolvedValue(mockUserWithCategories);
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			promotionsRepository.findAllPromotions = jest.fn().mockRejectedValue(prismaError);

			await expect(
				promotionsService.getPromotionsForUser('12345', DEFAULT_PAGINATION),
			).rejects.toThrowError(prismaError);
			expect(usersService.getUserInfoByTelegramId).toHaveBeenCalledWith('12345');
			expect(promotionsRepository.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					cityId: 1,
					isDeleted: false,
					status: PromotionStatus.APPROVED,
					startDate: { lte: expect.any(Date) },
					endDate: { gte: expect.any(Date) },
					categories: { some: { id: { in: [1] } } },
				},
				pagination: DEFAULT_PAGINATION,
				orderBy: { startDate: 'asc' },
			});
		});
	});
});
