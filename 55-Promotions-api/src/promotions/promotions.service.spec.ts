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
import { PromotionStatus } from '../common/constants';
import { Prisma } from '@prisma/client';
import { DEFAULT_PAGINATION } from '../common/pagination.interface';

const PromotionsRepositoryMock: IPromotionsRepository = {
	createPromotion: jest.fn(),
	findById: jest.fn(),
	findByIdOrThrow: jest.fn(),
	findBySupplier: jest.fn(),
	findAllPromotions: jest.fn(),
	updatePromotion: jest.fn(),
	deletePromotion: jest.fn(),
};

const UsersServiceMock: IUsersService = {
	createUser: jest.fn(),
	login: jest.fn(),
	getUserInfoByEmail: jest.fn(),
	getUserInfoById: jest.fn(),
	updateSupplierPassword: jest.fn(),
	deleteSupplier: jest.fn(),
	getAllSuppliers: jest.fn(),
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
		title: 'Test Promotion',
		description: 'Test Description Long Enough',
		startDate: getFutureDate(1),
		endDate: getFutureDate(7),
		status: 'PENDING' as PromotionStatus,
		supplierId: 1,
		isDeleted: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockActivePromotion = {
		id: 2,
		title: 'Active Promotion',
		description: 'Active Description Long Enough',
		startDate: getPastDate(1),
		endDate: getFutureDate(1),
		status: 'APPROVED' as PromotionStatus,
		supplierId: 1,
		isDeleted: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockUser = {
		id: 1,
		email: 'test@example.com',
		name: 'Test User',
		role: 'SUPPLIER',
		password: 'hashed',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAdmin = {
		id: 2,
		email: 'admin@example.com',
		name: 'Admin User',
		role: 'ADMIN',
		password: '',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Создание акции', () => {
		it('Должен успешно создать акцию', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.createPromotion = jest.fn().mockResolvedValue(mockPromotion);

			const result = await promotionsService.createPromotion({
				title: 'Test Promotion',
				description: 'Test Description Long Enough',
				startDate: mockPromotion.startDate.toISOString(),
				endDate: mockPromotion.endDate.toISOString(),
				userEmail: 'test@example.com',
				status: 'PENDING',
			});

			expect(result).toEqual(mockPromotion);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Test Promotion',
					description: 'Test Description Long Enough',
					startDate: mockPromotion.startDate,
					endDate: mockPromotion.endDate,
					status: 'PENDING',
					supplierId: 1,
					isDeleted: false,
				}),
			);
		});

		it('Должен успешно создать акцию с минимальным заголовком', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			const shortTitlePromotion = {
				...mockPromotion,
				title: 'T',
			};
			promotionsRepository.createPromotion = jest.fn().mockResolvedValue(shortTitlePromotion);

			const result = await promotionsService.createPromotion({
				title: 'T',
				description: 'Test Description Long Enough',
				startDate: mockPromotion.startDate.toISOString(),
				endDate: mockPromotion.endDate.toISOString(),
				userEmail: 'test@example.com',
				status: 'PENDING',
			});

			expect(result).toEqual(shortTitlePromotion);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'T',
					isDeleted: false,
				}),
			);
		});

		it('Должен успешно создать акцию с минимальным описанием', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			const shortDescPromotion = {
				...mockPromotion,
				description: 'Short',
			};
			promotionsRepository.createPromotion = jest.fn().mockResolvedValue(shortDescPromotion);

			const result = await promotionsService.createPromotion({
				title: 'Test Promotion',
				description: 'Short',
				startDate: mockPromotion.startDate.toISOString(),
				endDate: mockPromotion.endDate.toISOString(),
				userEmail: 'test@example.com',
				status: 'PENDING',
			});

			expect(result).toEqual(shortDescPromotion);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(
				expect.objectContaining({
					description: 'Short',
					isDeleted: false,
				}),
			);
		});

		it('Должен выбросить ошибку 404, если email пользователя отсутствует', async () => {
			await expect(
				promotionsService.createPromotion({
					title: 'Test Promotion',
					description: 'Test Description Long Enough',
					startDate: mockPromotion.startDate.toISOString(),
					endDate: mockPromotion.endDate.toISOString(),
					status: 'PENDING',
				}),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(promotionsRepository.createPromotion).not.toHaveBeenCalled();
		});

		it('Должен успешно создать акцию с указанным supplierId', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.createPromotion = jest.fn().mockResolvedValue(mockPromotion);

			const result = await promotionsService.createPromotion({
				title: 'Test Promotion',
				description: 'Test Description Long Enough',
				startDate: mockPromotion.startDate.toISOString(),
				endDate: mockPromotion.endDate.toISOString(),
				userEmail: 'test@example.com',
				supplierId: 1,
				status: 'PENDING',
			});

			expect(result).toEqual(mockPromotion);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(
				expect.objectContaining({
					supplierId: 1,
					isDeleted: false,
				}),
			);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '',
			});
			promotionsRepository.createPromotion = jest.fn().mockRejectedValue(prismaError);

			await expect(
				promotionsService.createPromotion({
					title: 'Test Promotion',
					description: 'Test Description Long Enough',
					startDate: mockPromotion.startDate.toISOString(),
					endDate: mockPromotion.endDate.toISOString(),
					userEmail: 'test@example.com',
					status: 'PENDING',
				}),
			).rejects.toThrowError(prismaError);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(promotionsRepository.createPromotion).toHaveBeenCalledWith(expect.any(Promotion));
		});
	});

	describe('Обновление акции', () => {
		it('Должен успешно обновить акцию', async () => {
			const updatedPromotion = {
				...mockPromotion,
				title: 'Updated Promotion',
			};
			promotionsRepository.updatePromotion = jest.fn().mockResolvedValue(updatedPromotion);

			const result = await promotionsService.updatePromotion(1, {
				title: 'Updated Promotion',
			});

			expect(result).toEqual(updatedPromotion);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, {
				title: 'Updated Promotion',
			});
		});

		it('Должен успешно обновить описание акции', async () => {
			const updatedPromotion = {
				...mockPromotion,
				description: 'Updated Description Long Enough',
			};
			promotionsRepository.updatePromotion = jest.fn().mockResolvedValue(updatedPromotion);

			const result = await promotionsService.updatePromotion(1, {
				description: 'Updated Description Long Enough',
			});

			expect(result).toEqual(updatedPromotion);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, {
				description: 'Updated Description Long Enough',
			});
		});

		it('Должен выбросить ошибку 422, если ID некорректен', async () => {
			await expect(
				promotionsService.updatePromotion(NaN, { title: 'Updated Promotion' }),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.INVALID_ID));
			expect(promotionsRepository.updatePromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если акция не найдена', async () => {
			promotionsRepository.updatePromotion = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(
				promotionsService.updatePromotion(999, { title: 'Updated Promotion' }),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(999, {
				title: 'Updated Promotion',
			});
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '',
			});
			promotionsRepository.updatePromotion = jest.fn().mockRejectedValue(prismaError);

			await expect(
				promotionsService.updatePromotion(1, { title: 'Updated Promotion' }),
			).rejects.toThrowError(prismaError);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, {
				title: 'Updated Promotion',
			});
		});
	});

	describe('Обновление статуса акции', () => {
		it('Должен успешно обновить статус акции', async () => {
			const updatedPromotion = {
				...mockPromotion,
				status: 'APPROVED',
			};
			promotionsRepository.updatePromotion = jest.fn().mockResolvedValue(updatedPromotion);

			const result = await promotionsService.updatePromotionStatus(1, 'APPROVED');

			expect(result).toEqual(updatedPromotion);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, { status: 'APPROVED' });
		});

		it('Должен выбросить ошибку 422, если ID некорректен', async () => {
			await expect(promotionsService.updatePromotionStatus(NaN, 'APPROVED')).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INVALID_ID),
			);
			expect(promotionsRepository.updatePromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если акция не найдена', async () => {
			promotionsRepository.updatePromotion = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(promotionsService.updatePromotionStatus(999, 'APPROVED')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
			);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(999, {
				status: 'APPROVED',
			});
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '',
			});
			promotionsRepository.updatePromotion = jest.fn().mockRejectedValue(prismaError);

			await expect(promotionsService.updatePromotionStatus(1, 'APPROVED')).rejects.toThrowError(
				prismaError,
			);
			expect(promotionsRepository.updatePromotion).toHaveBeenCalledWith(1, { status: 'APPROVED' });
		});
	});

	describe('Удаление акции', () => {
		it('Должен успешно выполнить мягкое удаление неактивной акции', async () => {
			const deletedPromotion = {
				...mockPromotion,
				isDeleted: true,
			};
			promotionsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockPromotion);
			promotionsRepository.deletePromotion = jest.fn().mockResolvedValue(deletedPromotion);

			const result = await promotionsService.deletePromotion(1);

			expect(result).toEqual(deletedPromotion);
			expect(promotionsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(promotionsRepository.deletePromotion).toHaveBeenCalledWith(1);
			expect(result.isDeleted).toBe(true);
		});

		it('Должен выбросить ошибку 422, если ID некорректен', async () => {
			await expect(promotionsService.deletePromotion(NaN)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INVALID_ID),
			);
			expect(promotionsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(promotionsRepository.deletePromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 400, если акция активна', async () => {
			promotionsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockActivePromotion);

			await expect(promotionsService.deletePromotion(2)).rejects.toThrowError(
				new HTTPError(400, MESSAGES.CANNOT_DELETE_ACTIVE_PROMOTION),
			);
			expect(promotionsRepository.findByIdOrThrow).toHaveBeenCalledWith(2);
			expect(promotionsRepository.deletePromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если акция не найдена', async () => {
			promotionsRepository.findByIdOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(promotionsService.deletePromotion(999)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
			);
			expect(promotionsRepository.findByIdOrThrow).toHaveBeenCalledWith(999);
			expect(promotionsRepository.deletePromotion).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			promotionsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockPromotion);
			promotionsRepository.deletePromotion = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));

			await expect(promotionsService.deletePromotion(1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
			);
			expect(promotionsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(promotionsRepository.deletePromotion).toHaveBeenCalledWith(1);
		});
	});

	describe('Получение всех акций', () => {
		it('Должен вернуть акции с фильтрами, исключая удалённые', async () => {
			promotionsRepository.findAllPromotions = jest.fn().mockResolvedValue({
				items: [mockPromotion],
				total: 1,
			});

			const result = await promotionsService.getAllPromotions({
				filters: { status: 'PENDING', active: 'true' },
				orderBy: { sortBy: 'title', sortOrder: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});

			expect(result).toEqual({ items: [mockPromotion], total: 1 });
			expect(promotionsRepository.findAllPromotions).toHaveBeenCalledWith({
				filters: {
					status: 'PENDING',
					endDate: { gte: expect.any(Date) },
					isDeleted: false,
				},
				orderBy: { title: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен вернуть акции с значениями по умолчанию, исключая удалённые', async () => {
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

		it('Должен выбросить ошибку 422, если параметр сортировки некорректен', async () => {
			await expect(
				promotionsService.getAllPromotions({
					orderBy: { sortBy: 'invalid', sortOrder: 'asc' },
				}),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.INVALID_SORT_PARAM));
			expect(promotionsRepository.findAllPromotions).not.toHaveBeenCalled();
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
		it('Должен вернуть акции для поставщика, исключая удалённые', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.findBySupplier = jest.fn().mockResolvedValue({
				items: [mockPromotion],
				total: 1,
			});

			const result = await promotionsService.getPromotionsBySupplier('test@example.com', {
				page: 1,
				limit: 10,
			});

			expect(result).toEqual({ items: [mockPromotion], total: 1 });
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(promotionsRepository.findBySupplier).toHaveBeenCalledWith(1, {
				page: 1,
				limit: 10,
			});
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен выбросить ошибку 404, если email отсутствует', async () => {
			await expect(promotionsService.getPromotionsBySupplier('')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(promotionsRepository.findBySupplier).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 403, если пользователь не является поставщиком', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			await expect(
				promotionsService.getPromotionsBySupplier('admin@example.com'),
			).rejects.toThrowError(new HTTPError(403, MESSAGES.FORBIDDEN));
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(promotionsRepository.findBySupplier).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			promotionsRepository.findBySupplier = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(
				promotionsService.getPromotionsBySupplier('test@example.com', {
					page: 1,
					limit: 10,
				}),
			).rejects.toThrowError('DB Error');
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(promotionsRepository.findBySupplier).toHaveBeenCalledWith(1, {
				page: 1,
				limit: 10,
			});
		});
	});
});