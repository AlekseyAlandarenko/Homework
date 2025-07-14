import { Container } from 'inversify';
import { IProductsRepository } from './products.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { IProductsService } from './products.service.interface';
import { TYPES } from '../types';
import { ProductsService } from './products.service';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { Product } from './product.entity';
import { Prisma } from '@prisma/client';
import { DEFAULT_PAGINATION } from '../common/constants';
import { ProductStatus } from '../common/enums/product-status.enum';
import { Role } from '../common/enums/role.enum';

const PrismaServiceMock = {
	count: jest.fn(),
	findUnique: jest.fn(),
	validateCity: jest.fn(),
	validateCategories: jest.fn(),
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

const UsersServiceMock: IUsersService = {
	createUser: jest.fn(),
	createTelegramUser: jest.fn(),
	getUserInfoByEmail: jest.fn(),
	getUserInfoById: jest.fn(),
	getUserInfoByTelegramId: jest.fn(),
	getAllWarehouseManagers: jest.fn(),
	getProductsForUser: jest.fn(),
	getUserAddresses: jest.fn(),
	updateWarehouseManagerPassword: jest.fn(),
	updateUserTelegramId: jest.fn(),
	updateUserProfile: jest.fn(),
	updateUserCategories: jest.fn(),
	deleteWarehouseManager: jest.fn(),
	login: jest.fn(),
};

const container = new Container();
let productsRepository: IProductsRepository;
let usersService: IUsersService;
let productsService: IProductsService;

beforeAll(() => {
	container.bind<IProductsService>(TYPES.ProductsService).to(ProductsService);
	container
		.bind<IProductsRepository>(TYPES.ProductsRepository)
		.toConstantValue(ProductsRepositoryMock);
	container.bind<IUsersService>(TYPES.UsersService).toConstantValue(UsersServiceMock);
	container.bind(TYPES.PrismaService).toConstantValue(PrismaServiceMock);

	productsRepository = container.get<IProductsRepository>(TYPES.ProductsRepository);
	usersService = container.get<IUsersService>(TYPES.UsersService);
	productsService = container.get<IProductsService>(TYPES.ProductsService);
});

describe('Сервис товаров', () => {
	const mockProduct = {
		id: 1,
		name: 'Тестовый Товар',
		description: 'Тестовое Описание Достаточной Длины',
		price: 100,
		quantity: 10,
		sku: 'TEST123',
		status: ProductStatus.AVAILABLE,
		createdById: 1,
		updatedById: 1,
		cityId: 1,
		isDeleted: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockOutOfStockProduct = {
		id: 2,
		name: 'Товар без запаса',
		description: 'Описание товара без запаса',
		price: 200,
		quantity: 0,
		sku: 'OUT123',
		status: ProductStatus.OUT_OF_STOCK,
		createdById: 1,
		updatedById: 1,
		cityId: 1,
		isDeleted: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockUser = {
		id: 1,
		email: 'test@example.com',
		name: 'Тестовый Начальник Склада',
		role: Role.WAREHOUSE_MANAGER,
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

	const mockProductWithRelations = {
		...mockProduct,
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

	describe('Создание товара', () => {
		it('Должен успешно создать товар', async () => {
			productsRepository.findProductByKey = jest.fn().mockResolvedValue(null);
			productsRepository.createProduct = jest.fn().mockResolvedValue(mockProduct);
			PrismaServiceMock.validateCity.mockResolvedValue(undefined);
			PrismaServiceMock.validateCategories.mockResolvedValue(undefined);

			const result = await productsService.createProduct({
				name: 'Тестовый Товар',
				description: 'Тестовое Описание Достаточной Длины',
				price: 100,
				quantity: 10,
				sku: 'TEST123',
				cityId: 1,
				categoryIds: [1],
				userId: 1,
				status: ProductStatus.AVAILABLE,
			});

			expect(result).toEqual(mockProduct);
			expect(productsRepository.findProductByKey).toHaveBeenCalledWith(
				'sku',
				'TEST123',
				undefined,
				false,
			);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(1);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([1]);
			expect(productsRepository.createProduct).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Тестовый Товар',
					description: 'Тестовое Описание Достаточной Длины',
					price: 100,
					quantity: 10,
					sku: 'TEST123',
					cityId: 1,
					categoryIds: [1],
					createdById: 1,
					status: ProductStatus.AVAILABLE,
					isDeleted: false,
				}),
			);
		});

		it('Должен успешно создать товар с минимальным описанием', async () => {
			productsRepository.findProductByKey = jest.fn().mockResolvedValue(null);
			const shortDescProduct = {
				...mockProduct,
				description: 'Короткое',
			};
			productsRepository.createProduct = jest.fn().mockResolvedValue(shortDescProduct);
			PrismaServiceMock.validateCity.mockResolvedValue(undefined);
			PrismaServiceMock.validateCategories.mockResolvedValue(undefined);

			const result = await productsService.createProduct({
				name: 'Тестовый Товар',
				description: 'Короткое',
				price: 100,
				quantity: 10,
				sku: 'TEST123',
				cityId: 1,
				categoryIds: [1],
				userId: 1,
				status: ProductStatus.AVAILABLE,
			});

			expect(result).toEqual(shortDescProduct);
			expect(productsRepository.findProductByKey).toHaveBeenCalledWith(
				'sku',
				'TEST123',
				undefined,
				false,
			);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(1);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([1]);
			expect(productsRepository.createProduct).toHaveBeenCalledWith(
				expect.objectContaining({
					description: 'Короткое',
					status: ProductStatus.AVAILABLE,
					isDeleted: false,
				}),
			);
		});

		it('Должен выбросить ошибку 409, если товар с таким SKU уже существует', async () => {
			productsRepository.findProductByKey = jest.fn().mockResolvedValue(mockProduct);

			await expect(
				productsService.createProduct({
					name: 'Тестовый Товар',
					description: 'Тестовое Описание Достаточной Длины',
					price: 100,
					quantity: 10,
					sku: 'TEST123',
					cityId: 1,
					categoryIds: [1],
					userId: 1,
					status: ProductStatus.AVAILABLE,
				}),
			).rejects.toThrowError(new HTTPError(409, MESSAGES.PRODUCT_SKU_ALREADY_EXISTS));
			expect(productsRepository.findProductByKey).toHaveBeenCalledWith(
				'sku',
				'TEST123',
				undefined,
				false,
			);
			expect(PrismaServiceMock.validateCity).not.toHaveBeenCalled();
			expect(PrismaServiceMock.validateCategories).not.toHaveBeenCalled();
			expect(productsRepository.createProduct).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			productsRepository.findProductByKey = jest.fn().mockResolvedValue(null);
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '',
			});
			productsRepository.createProduct = jest.fn().mockRejectedValue(prismaError);
			PrismaServiceMock.validateCity.mockResolvedValue(undefined);
			PrismaServiceMock.validateCategories.mockResolvedValue(undefined);

			await expect(
				productsService.createProduct({
					name: 'Тестовый Товар',
					description: 'Тестовое Описание Достаточной Длины',
					price: 100,
					quantity: 10,
					sku: 'TEST123',
					cityId: 1,
					categoryIds: [1],
					userId: 1,
					status: ProductStatus.AVAILABLE,
				}),
			).rejects.toThrowError(prismaError);
			expect(productsRepository.findProductByKey).toHaveBeenCalledWith(
				'sku',
				'TEST123',
				undefined,
				false,
			);
			expect(PrismaServiceMock.validateCity).toHaveBeenCalledWith(1);
			expect(PrismaServiceMock.validateCategories).toHaveBeenCalledWith([1]);
			expect(productsRepository.createProduct).toHaveBeenCalledWith(expect.any(Product));
		});
	});

	describe('Обновление товара', () => {
		it('Должен успешно обновить товар', async () => {
			const updatedProduct = {
				...mockProduct,
				name: 'Обновленный Товар',
			};
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.findProductByKey = jest.fn().mockResolvedValue(null);
			productsRepository.updateProduct = jest.fn().mockResolvedValue(updatedProduct);

			const result = await productsService.updateProduct(1, { name: 'Обновленный Товар' }, 1);

			expect(result).toEqual(updatedProduct);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).toHaveBeenCalledWith(1, {
				name: 'Обновленный Товар',
				updatedBy: { connect: { id: 1 } },
			});
		});

		it('Должен успешно обновить описание товара', async () => {
			const updatedProduct = {
				...mockProduct,
				description: 'Обновленное Описание Достаточной Длины',
			};
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.findProductByKey = jest.fn().mockResolvedValue(null);
			productsRepository.updateProduct = jest.fn().mockResolvedValue(updatedProduct);

			const result = await productsService.updateProduct(
				1,
				{ description: 'Обновленное Описание Достаточной Длины' },
				1,
			);

			expect(result).toEqual(updatedProduct);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).toHaveBeenCalledWith(1, {
				description: 'Обновленное Описание Достаточной Длины',
				updatedBy: { connect: { id: 1 } },
			});
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			await expect(
				productsService.updateProduct(999, { name: 'Обновленный Товар' }, 1),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '',
			});
			productsRepository.findProductByKeyOrThrow = jest.fn().mockRejectedValue(prismaError);
			productsRepository.findProductByKey = jest.fn().mockResolvedValue(null);

			await expect(
				productsService.updateProduct(1, { name: 'Обновленный Товар' }, 1),
			).rejects.toThrowError(prismaError);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).not.toHaveBeenCalled();
		});
	});

	describe('Обновление количества товара', () => {
		it('Должен успешно обновить количество товара', async () => {
			const updatedProduct = {
				...mockProduct,
				quantity: 15,
			};
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.updateProduct = jest.fn().mockResolvedValue(updatedProduct);

			const result = await productsService.updateProductQuantity(1, { quantity: 5 }, 1);

			expect(result).toEqual(updatedProduct);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).toHaveBeenCalledWith(1, {
				quantity: 15,
				status: ProductStatus.AVAILABLE,
				updatedBy: { connect: { id: 1 } },
			});
		});

		it('Должен установить статус OUT_OF_STOCK при обновлении количества до нуля', async () => {
			const updatedProduct = {
				...mockProduct,
				quantity: 0,
				status: ProductStatus.OUT_OF_STOCK,
			};
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.updateProduct = jest.fn().mockResolvedValue(updatedProduct);

			const result = await productsService.updateProductQuantity(1, { quantity: -10 }, 1);

			expect(result).toEqual(updatedProduct);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).toHaveBeenCalledWith(1, {
				quantity: 0,
				status: ProductStatus.OUT_OF_STOCK,
				updatedBy: { connect: { id: 1 } },
			});
		});

		it('Должен выбросить ошибку 422, если новое количество отрицательное', async () => {
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);

			await expect(
				productsService.updateProductQuantity(1, { quantity: -15 }, 1),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE));
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			await expect(
				productsService.updateProductQuantity(999, { quantity: 5 }, 1),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '',
			});
			productsRepository.updateProduct = jest.fn().mockRejectedValue(prismaError);

			await expect(
				productsService.updateProductQuantity(1, { quantity: 5 }, 1),
			).rejects.toThrowError(prismaError);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).toHaveBeenCalledWith(1, {
				quantity: 15,
				status: ProductStatus.AVAILABLE,
				updatedBy: { connect: { id: 1 } },
			});
		});
	});

	describe('Покупка товара', () => {
		it('Должен успешно выполнить покупку товара', async () => {
			const updatedProduct = {
				...mockProduct,
				quantity: 5,
			};
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.updateProduct = jest.fn().mockResolvedValue(updatedProduct);

			const result = await productsService.purchaseProduct(1, { quantity: 5 }, 1);

			expect(result).toEqual(updatedProduct);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).toHaveBeenCalledWith(1, {
				quantity: 5,
				status: ProductStatus.AVAILABLE,
				updatedBy: { connect: { id: 1 } },
			});
		});

		it('Должен установить статус OUT_OF_STOCK при покупке всего количества', async () => {
			const updatedProduct = {
				...mockProduct,
				quantity: 0,
				status: ProductStatus.OUT_OF_STOCK,
			};
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.updateProduct = jest.fn().mockResolvedValue(updatedProduct);

			const result = await productsService.purchaseProduct(1, { quantity: 10 }, 1);

			expect(result).toEqual(updatedProduct);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).toHaveBeenCalledWith(1, {
				quantity: 0,
				status: ProductStatus.OUT_OF_STOCK,
				updatedBy: { connect: { id: 1 } },
			});
		});

		it('Должен выбросить ошибку 422, если товара недостаточно', async () => {
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);

			await expect(productsService.purchaseProduct(1, { quantity: 15 }, 1)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK),
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			await expect(productsService.purchaseProduct(999, { quantity: 5 }, 1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.updateProduct).not.toHaveBeenCalled();
		});
	});

	describe('Удаление товара', () => {
		it('Должно успешно выполнить мягкое удаление товара', async () => {
			const deletedProduct = {
				...mockOutOfStockProduct,
				isDeleted: true,
			};
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockResolvedValue(mockOutOfStockProduct);
			productsRepository.deleteProduct = jest.fn().mockResolvedValue(deletedProduct);

			const result = await productsService.deleteProduct(2, 1);

			expect(result).toEqual(deletedProduct);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				2,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.deleteProduct).toHaveBeenCalledWith(2);
			expect(result.isDeleted).toBe(true);
		});

		it('Должен выбросить ошибку 422, если товар в статусе AVAILABLE', async () => {
			productsRepository.findProductByKeyOrThrow = jest.fn().mockResolvedValue(mockProduct);

			await expect(productsService.deleteProduct(1, 1)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.CANNOT_DELETE_ACTIVE_PRODUCT),
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.deleteProduct).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			await expect(productsService.deleteProduct(999, 1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.deleteProduct).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockResolvedValue(mockOutOfStockProduct);
			productsRepository.deleteProduct = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			await expect(productsService.deleteProduct(2, 1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				2,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
			expect(productsRepository.deleteProduct).toHaveBeenCalledWith(2);
		});
	});

	describe('Получение всех товаров', () => {
		it('Должен получить товары с фильтрами, исключая удалённые', async () => {
			productsRepository.findAllProducts = jest.fn().mockResolvedValue({
				items: [mockProduct],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});

			const result = await productsService.getAllProducts({
				filters: {
					status: ProductStatus.AVAILABLE,
					sortBy: 'name',
					sortOrder: 'asc',
				},
				pagination: DEFAULT_PAGINATION,
			});

			expect(result).toEqual({
				items: [mockProduct],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});
			expect(productsRepository.findAllProducts).toHaveBeenCalledWith({
				filters: {
					isDeleted: false,
					status: ProductStatus.AVAILABLE,
				},
				orderBy: { name: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен получить товары с значениями по умолчанию, исключая удалённые', async () => {
			productsRepository.findAllProducts = jest.fn().mockResolvedValue({
				items: [mockProduct],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});

			const result = await productsService.getAllProducts({});

			expect(result).toEqual({
				items: [mockProduct],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});
			expect(productsRepository.findAllProducts).toHaveBeenCalledWith({
				filters: { isDeleted: false },
				orderBy: { createdAt: 'desc' },
				pagination: DEFAULT_PAGINATION,
			});
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен корректно обрабатывать параметры сортировки через filters', async () => {
			productsRepository.findAllProducts = jest.fn().mockResolvedValue({
				items: [mockProduct],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});

			const result = await productsService.getAllProducts({
				filters: { sortBy: 'name', sortOrder: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});

			expect(result).toEqual({
				items: [mockProduct],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});
			expect(productsRepository.findAllProducts).toHaveBeenCalledWith({
				filters: { isDeleted: false },
				orderBy: { name: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			productsRepository.findAllProducts = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(productsService.getAllProducts({})).rejects.toThrowError('DB Error');
			expect(productsRepository.findAllProducts).toHaveBeenCalledWith({
				filters: { isDeleted: false },
				orderBy: { createdAt: 'desc' },
				pagination: DEFAULT_PAGINATION,
			});
		});
	});

	describe('Получение товаров на складе', () => {
		it('Должен успешно получить товары на складе', async () => {
			const stockProducts = [{ id: 1, sku: 'TEST123', quantity: 10 }];
			productsRepository.findStockProducts = jest.fn().mockResolvedValue({
				items: stockProducts,
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});

			const result = await productsService.getStockProducts(DEFAULT_PAGINATION);

			expect(result).toEqual({
				items: stockProducts,
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});
			expect(productsRepository.findStockProducts).toHaveBeenCalledWith(DEFAULT_PAGINATION);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			productsRepository.findStockProducts = jest.fn().mockRejectedValue(prismaError);

			await expect(productsService.getStockProducts(DEFAULT_PAGINATION)).rejects.toThrowError(
				prismaError,
			);
			expect(productsRepository.findStockProducts).toHaveBeenCalledWith(DEFAULT_PAGINATION);
		});
	});

	describe('Получение товаров по начальнику склада', () => {
		it('Должен получить товары для начальника склада, исключая удаленные', async () => {
			productsRepository.findProductsByCreator = jest.fn().mockResolvedValue({
				items: [mockProduct],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});

			const result = await productsService.getProductsByCreator(1, DEFAULT_PAGINATION);

			expect(result).toEqual({
				items: [mockProduct],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});
			expect(productsRepository.findProductsByCreator).toHaveBeenCalledWith(1, DEFAULT_PAGINATION);
			expect(result.items.every((item) => item.isDeleted === false)).toBe(true);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			productsRepository.findProductsByCreator = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(
				productsService.getProductsByCreator(1, DEFAULT_PAGINATION),
			).rejects.toThrowError('DB Error');
			expect(productsRepository.findProductsByCreator).toHaveBeenCalledWith(1, DEFAULT_PAGINATION);
		});
	});

	describe('Получение товара по ID', () => {
		it('Должен успешно получить товар для администратора', async () => {
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockResolvedValue(mockProductWithRelations);

			const result = await productsService.getProductById(1, 2, Role.ADMIN);

			expect(result).toEqual(mockProductWithRelations);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
		});

		it('Должен успешно получить товар для начальника склада, независимо от создателя', async () => {
			const mockProductWithRelationsOtherCreator = {
				...mockProduct,
				createdById: 2,
				categories: [{ id: 1, name: 'Еда' }],
				city: { id: 1, name: 'Москва' },
			};
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockResolvedValue(mockProductWithRelationsOtherCreator);

			const result = await productsService.getProductById(1, 1, Role.WAREHOUSE_MANAGER);

			expect(result).toEqual(mockProductWithRelationsOtherCreator);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			productsRepository.findProductByKeyOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			await expect(productsService.getProductById(999, 2, Role.ADMIN)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				999,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			productsRepository.findProductByKeyOrThrow = jest.fn().mockRejectedValue(prismaError);

			await expect(productsService.getProductById(1, 2, Role.ADMIN)).rejects.toThrowError(
				prismaError,
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				1,
				undefined,
				MESSAGES.PRODUCT_NOT_FOUND,
			);
		});
	});

	describe('Получение товаров для пользователя по Telegram ID', () => {
		it('Должен успешно получить товары для пользователя', async () => {
			usersService.getUserInfoByTelegramId = jest.fn().mockResolvedValue(mockUserWithCategories);
			productsRepository.findAllProducts = jest.fn().mockResolvedValue({
				items: [mockProductWithRelations],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});

			const result = await productsService.getProductsForUser('12345', DEFAULT_PAGINATION);

			expect(result).toEqual({
				items: [mockProductWithRelations],
				total: 1,
				meta: {
					total: 1,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 1,
				},
			});
			expect(usersService.getUserInfoByTelegramId).toHaveBeenCalledWith('12345');
			expect(productsRepository.findAllProducts).toHaveBeenCalledWith({
				filters: {
					cityId: 1,
					isDeleted: false,
					status: ProductStatus.AVAILABLE,
					quantity: { gt: 0 },
					categories: { some: { id: { in: [1] } } },
				},
				pagination: DEFAULT_PAGINATION,
				orderBy: { createdAt: 'asc' },
			});
		});

		it('Должен вернуть пустой список, если подходящих товаров нет', async () => {
			usersService.getUserInfoByTelegramId = jest.fn().mockResolvedValue(mockUserWithCategories);
			productsRepository.findAllProducts = jest.fn().mockResolvedValue({
				items: [],
				total: 0,
				meta: {
					total: 0,
					page: 1,
					limit: DEFAULT_PAGINATION.limit,
					totalPages: 0,
				},
			});

			const result = await productsService.getProductsForUser('12345', DEFAULT_PAGINATION);

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
			expect(productsRepository.findAllProducts).toHaveBeenCalledWith({
				filters: {
					cityId: 1,
					isDeleted: false,
					status: ProductStatus.AVAILABLE,
					quantity: { gt: 0 },
					categories: { some: { id: { in: [1] } } },
				},
				pagination: DEFAULT_PAGINATION,
				orderBy: { createdAt: 'asc' },
			});
		});

		it('Должен выбросить ошибку 404, если пользователь не найден', async () => {
			usersService.getUserInfoByTelegramId = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(
				productsService.getProductsForUser('12345', DEFAULT_PAGINATION),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(usersService.getUserInfoByTelegramId).toHaveBeenCalledWith('12345');
			expect(productsRepository.findAllProducts).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			usersService.getUserInfoByTelegramId = jest.fn().mockResolvedValue(mockUserWithCategories);
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			productsRepository.findAllProducts = jest.fn().mockRejectedValue(prismaError);

			await expect(
				productsService.getProductsForUser('12345', DEFAULT_PAGINATION),
			).rejects.toThrowError(prismaError);
			expect(usersService.getUserInfoByTelegramId).toHaveBeenCalledWith('12345');
			expect(productsRepository.findAllProducts).toHaveBeenCalledWith({
				filters: {
					cityId: 1,
					isDeleted: false,
					status: ProductStatus.AVAILABLE,
					quantity: { gt: 0 },
					categories: { some: { id: { in: [1] } } },
				},
				pagination: DEFAULT_PAGINATION,
				orderBy: { createdAt: 'asc' },
			});
		});
	});
});
