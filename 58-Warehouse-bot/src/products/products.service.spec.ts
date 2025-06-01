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
import { DEFAULT_PAGINATION } from '../common/pagination.interface';

const ProductsRepositoryMock: IProductsRepository = {
	create: jest.fn(),
	findById: jest.fn(),
	findByIdOrThrow: jest.fn(),
	findBySku: jest.fn(),
	findAll: jest.fn(),
	findByCreator: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
	findStock: jest.fn(),
};

const UsersServiceMock: IUsersService = {
	createUser: jest.fn(),
	login: jest.fn(),
	getUserInfoByEmail: jest.fn(),
	getUserInfoById: jest.fn(),
	updateWarehouseManagerPassword: jest.fn(),
	deleteWarehouseManager: jest.fn(),
	getAllWarehouseManagers: jest.fn(),
	findByTelegramId: jest.fn(),
	updateTelegramId: jest.fn(),
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

	productsRepository = container.get<IProductsRepository>(TYPES.ProductsRepository);
	usersService = container.get<IUsersService>(TYPES.UsersService);
	productsService = container.get<IProductsService>(TYPES.ProductsService);
});

describe('Сервис продуктов', () => {
	const mockProduct = {
		id: 1,
		name: 'Ноутбук HP EliteBook',
		description: '15.6", Core i7, 16GB RAM',
		price: 1250.99,
		quantity: 10,
		category: 'Электроника',
		sku: 'NB-HP-ELITE-001',
		isActive: true,
		isDeleted: false,
		createdById: 1,
		updatedById: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockProductForWarehouseManager = {
		...mockProduct,
		createdById: 4,
		updatedById: 4,
	};

	const mockInactiveProduct = {
		id: 2,
		name: 'Смартфон Samsung Galaxy',
		description: '6.5", 8GB RAM',
		price: 799.99,
		quantity: 5,
		category: 'Электроника',
		sku: 'SM-SG-001',
		isActive: false,
		isDeleted: false,
		createdById: 1,
		updatedById: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockOutOfStockProduct = {
		id: 3,
		name: 'Планшет Apple iPad',
		description: '10.2", 64GB',
		price: 499.99,
		quantity: 0,
		category: 'Электроника',
		sku: 'TB-AP-IPAD-001',
		isActive: true,
		isDeleted: false,
		createdById: 1,
		updatedById: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockUser = {
		id: 1,
		email: 'test@example.com',
		name: 'Test User',
		role: 'WAREHOUSE_MANAGER',
		password: 'hashed',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAdmin = {
		id: 2,
		email: 'admin@example.com',
		name: 'Admin User',
		role: 'ADMIN',
		password: 'hashed',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockSuperAdmin = {
		id: 3,
		email: 'superadmin@example.com',
		name: 'Super Admin',
		role: 'SUPERADMIN',
		password: 'hashed',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockWarehouseManager = {
		id: 4,
		email: 'warehouseManager@example.com',
		name: 'WarehouseManager User',
		role: 'WAREHOUSE_MANAGER',
		password: 'hashed',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Создание продукта', () => {
		it('Должен успешно создать продукт', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			productsRepository.create = jest.fn().mockResolvedValue(mockProduct);

			const result = await productsService.createProduct({
				name: 'Ноутбук HP EliteBook',
				description: '15.6", Core i7, 16GB RAM',
				price: 1250.99,
				quantity: 10,
				category: 'Электроника',
				sku: 'NB-HP-ELITE-001',
				isActive: true,
				userEmail: 'admin@example.com',
			});

			expect(result).toEqual(mockProduct);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findBySku).toHaveBeenCalledWith('NB-HP-ELITE-001');
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
			const productArg = (productsRepository.create as jest.Mock).mock.calls[0][0];
			expect(productArg.name).toBe('Ноутбук HP EliteBook');
			expect(productArg.sku).toBe('NB-HP-ELITE-001');
			expect(productArg.createdById).toBe(2);
			expect(productArg.updatedById).toBe(2);
		});

		it('Должен выбросить ошибку 404, если email пользователя отсутствует', async () => {
			await expect(
				productsService.createProduct({
					name: 'Ноутбук HP EliteBook',
					description: '15.6", Core i7, 16GB RAM',
					price: 1250.99,
					quantity: 10,
					category: 'Электроника',
					sku: 'NB-HP-ELITE-001',
					isActive: true,
				}),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(productsRepository.create).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 422, если SKU уже существует', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(mockProduct);

			await expect(
				productsService.createProduct({
					name: 'Ноутбук HP EliteBook',
					description: '15.6", Core i7, 16GB RAM',
					price: 1250.99,
					quantity: 10,
					category: 'Электроника',
					sku: 'NB-HP-ELITE-001',
					isActive: true,
					userEmail: 'admin@example.com',
				}),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.SKU_ALREADY_EXISTS));
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findBySku).toHaveBeenCalledWith('NB-HP-ELITE-001');
			expect(productsRepository.create).not.toHaveBeenCalled();
		});

		it('Должен успешно создать продукт с коротким названием', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			productsRepository.create = jest.fn().mockResolvedValue({
				...mockProduct,
				name: 'HP',
			});

			const result = await productsService.createProduct({
				name: 'HP',
				description: '15.6", Core i7, 16GB RAM',
				price: 1250.99,
				quantity: 10,
				category: 'Электроника',
				sku: 'NB-HP-ELITE-001',
				isActive: true,
				userEmail: 'admin@example.com',
			});

			expect(result).toEqual({ ...mockProduct, name: 'HP' });
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
		});

		it('Должен успешно создать продукт с корректной ценой', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			productsRepository.create = jest.fn().mockResolvedValue(mockProduct);

			const result = await productsService.createProduct({
				name: 'Ноутбук HP EliteBook',
				description: '15.6", Core i7, 16GB RAM',
				price: 1250.99,
				quantity: 10,
				category: 'Электроника',
				sku: 'NB-HP-ELITE-001',
				isActive: true,
				userEmail: 'admin@example.com',
			});

			expect(result).toEqual(mockProduct);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findBySku).toHaveBeenCalledWith('NB-HP-ELITE-001');
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2002',
				clientVersion: '1.0',
			});
			productsRepository.create = jest.fn().mockRejectedValue(prismaError);

			await expect(
				productsService.createProduct({
					name: 'Ноутбук HP EliteBook',
					description: '15.6", Core i7, 16GB RAM',
					price: 1250.99,
					quantity: 10,
					category: 'Электроника',
					sku: 'NB-HP-ELITE-001',
					isActive: true,
					userEmail: 'admin@example.com',
				}),
			).rejects.toThrowError(prismaError);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findBySku).toHaveBeenCalledWith('NB-HP-ELITE-001');
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
		});
	});

	describe('Получение всех продуктов', () => {
		it('Должен вернуть продукты с фильтрами', async () => {
			productsRepository.findAll = jest.fn().mockResolvedValue({
				items: [mockProduct],
				total: 1,
			});

			const result = await productsService.getAllProducts({
				filters: { category: 'Электроника', isActive: true },
				orderBy: { sortBy: 'name', sortOrder: 'asc' },
				pagination: DEFAULT_PAGINATION,
			});

			expect(result).toEqual({ items: [mockProduct], total: 1 });
			expect(productsRepository.findAll).toHaveBeenCalledWith({
				pagination: DEFAULT_PAGINATION,
				filters: { category: 'Электроника', isActive: true, isDeleted: false },
				orderBy: { name: 'asc' },
			});
		});

		it('Должен использовать значения по умолчанию', async () => {
			productsRepository.findAll = jest.fn().mockResolvedValue({
				items: [mockProduct],
				total: 1,
			});

			const result = await productsService.getAllProducts({ pagination: DEFAULT_PAGINATION });

			expect(result).toEqual({ items: [mockProduct], total: 1 });
			expect(productsRepository.findAll).toHaveBeenCalledWith({
				pagination: DEFAULT_PAGINATION,
				filters: { isDeleted: false },
				orderBy: { createdAt: 'desc' },
			});
		});

		it('Должен выбросить ошибку 422 для некорректной пагинации', async () => {
			await expect(
				productsService.getAllProducts({
					pagination: { page: -1, limit: 10 },
				}),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.VALIDATION_FAILED));
			expect(productsRepository.findAll).not.toHaveBeenCalled();
		});
	});

	describe('Получение продуктов по создателю', () => {
		it('Должен вернуть продукты для создателя', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockWarehouseManager);
			productsRepository.findByCreator = jest.fn().mockResolvedValue({
				items: [mockProductForWarehouseManager],
				total: 1,
			});

			const result = await productsService.getProductsByCreator(
				'warehouseManager@example.com',
				DEFAULT_PAGINATION,
			);

			expect(result).toEqual({ items: [mockProductForWarehouseManager], total: 1 });
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('warehouseManager@example.com');
			expect(productsRepository.findByCreator).toHaveBeenCalledWith(4, DEFAULT_PAGINATION);
		});

		it('Должен выбросить ошибку 403 для пользователя без роли WAREHOUSE_MANAGER', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);

			await expect(
				productsService.getProductsByCreator('admin@example.com', DEFAULT_PAGINATION),
			).rejects.toThrowError(new HTTPError(403, MESSAGES.FORBIDDEN));
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findByCreator).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если email отсутствует', async () => {
			await expect(productsService.getProductsByCreator('')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(productsRepository.findByCreator).not.toHaveBeenCalled();
		});
	});

	describe('Обновление продукта', () => {
		it('Должен успешно обновить продукт', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			productsRepository.update = jest.fn().mockResolvedValue({
				...mockProduct,
				name: 'Обновленный ноутбук',
			});

			const result = await productsService.updateProduct(
				1,
				{ name: 'Обновленный ноутбук' },
				'admin@example.com',
			);

			expect(result).toEqual({ ...mockProduct, name: 'Обновленный ноутбук' });
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(productsRepository.findBySku).not.toHaveBeenCalled();
			expect(productsRepository.update).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ name: 'Обновленный ноутбук', updatedById: mockAdmin.id }),
			);
		});

		it('Должен выбросить ошибку 422 для некорректного ID', async () => {
			await expect(
				productsService.updateProduct(NaN, { name: 'Обновленный ноутбук' }, 'admin@example.com'),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.INVALID_ID));
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если email отсутствует', async () => {
			await expect(
				productsService.updateProduct(1, { name: 'Обновленный ноутбук' }, undefined),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});
	});

	describe('Обновление количества продукта', () => {
		it('Должен успешно обновить количество продукта', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.update = jest.fn().mockResolvedValue({
				...mockProduct,
				quantity: 30,
			});

			const result = await productsService.updateProductQuantity(
				1,
				{ quantity: 20 },
				'test@example.com',
			);

			expect(result).toEqual({ ...mockProduct, quantity: 30 });
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(productsRepository.update).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ quantity: 30, updatedById: mockUser.id }),
			);
		});

		it('Должен выбросить ошибку 422 для отрицательного итогового количества', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockProduct);

			await expect(
				productsService.updateProductQuantity(1, { quantity: -20 }, 'test@example.com'),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE));
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(productsRepository.update).not.toHaveBeenCalled();
		});
	});

	describe('Удаление продукта', () => {
		it('Должен успешно удалить продукт', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.delete = jest.fn().mockResolvedValue(mockProduct);

			const result = await productsService.deleteProduct(1, 'admin@example.com');

			expect(result).toEqual(mockProduct);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.delete).toHaveBeenCalledWith(1);
		});

		it('Должен выбросить ошибку 404, если продукт не найден', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.delete = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			await expect(productsService.deleteProduct(999, 'admin@example.com')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.delete).toHaveBeenCalledWith(999);
		});
	});

	describe('Получение информации о запасах', () => {
		it('Должен успешно вернуть информацию о запасах', async () => {
			productsRepository.findStock = jest.fn().mockResolvedValue({
				items: [{ id: 1, sku: 'NB-HP-ELITE-001', quantity: 10 }],
				total: 1,
			});

			const result = await productsService.getStock(DEFAULT_PAGINATION);

			expect(result).toEqual({
				items: [{ id: 1, sku: 'NB-HP-ELITE-001', quantity: 10 }],
				total: 1,
			});
			expect(productsRepository.findStock).toHaveBeenCalledWith(DEFAULT_PAGINATION);
		});
	});

	describe('Проверка ролей', () => {
		it('Должен разрешить создание продукта супер-администратору', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockSuperAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			productsRepository.create = jest.fn().mockResolvedValue(mockProduct);

			const result = await productsService.createProduct({
				name: 'Ноутбук HP EliteBook',
				description: '15.6", Core i7, 16GB RAM',
				price: 1250.99,
				quantity: 10,
				category: 'Электроника',
				sku: 'NB-HP-ELITE-001',
				isActive: true,
				userEmail: 'superadmin@example.com',
			});

			expect(result).toEqual(mockProduct);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('superadmin@example.com');
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
		});

		it('Должен разрешить удаление продукта администратору', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.delete = jest.fn().mockResolvedValue(mockProduct);

			const result = await productsService.deleteProduct(1, 'admin@example.com');

			expect(result).toEqual(mockProduct);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.delete).toHaveBeenCalledWith(1);
		});
	});

	describe('Граничные случаи', () => {
		it('Должен успешно создать продукт с минимальной ценой', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			productsRepository.create = jest.fn().mockResolvedValue({
				...mockProduct,
				price: 0,
			});

			const result = await productsService.createProduct({
				name: 'Ноутбук HP EliteBook',
				description: '15.6", Core i7, 16GB RAM',
				price: 0,
				quantity: 10,
				category: 'Электроника',
				sku: 'NB-HP-ELITE-001',
				isActive: true,
				userEmail: 'admin@example.com',
			});

			expect(result).toEqual({ ...mockProduct, price: 0 });
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
		});

		it('Должен успешно создать продукт с короткой категорией', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			productsRepository.create = jest.fn().mockResolvedValue({
				...mockProduct,
				category: 'Эл',
			});

			const result = await productsService.createProduct({
				name: 'Ноутбук HP EliteBook',
				description: '15.6", Core i7, 16GB RAM',
				price: 1250.99,
				quantity: 10,
				category: 'Эл',
				sku: 'NB-HP-ELITE-001',
				isActive: true,
				userEmail: 'admin@example.com',
			});

			expect(result).toEqual({ ...mockProduct, category: 'Эл' });
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
		});

		it('Должен успешно создать продукт с коротким SKU', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findBySku = jest.fn().mockResolvedValue(null);
			productsRepository.create = jest.fn().mockResolvedValue({
				...mockProduct,
				sku: 'NB',
			});

			const result = await productsService.createProduct({
				name: 'Ноутбук HP EliteBook',
				description: '15.6", Core i7, 16GB RAM',
				price: 1250.99,
				quantity: 10,
				category: 'Электроника',
				sku: 'NB',
				isActive: true,
				userEmail: 'admin@example.com',
			});

			expect(result).toEqual({ ...mockProduct, sku: 'NB' });
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
		});
	});
});