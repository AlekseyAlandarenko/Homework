import { Container } from 'inversify';
import { IProductsRepository } from './products.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { IProductsService } from './products.service.interface';
import { TYPES } from '../types';
import { ProductsService } from './products.service';
import { ProductModel, Prisma, Role } from '@prisma/client';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { Product } from './product.entity';

const ProductsRepositoryMock: IProductsRepository = {
	create: jest.fn(),
	findAll: jest.fn(),
	findByManager: jest.fn(),
	findById: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
};

const UsersServiceMock: IUsersService = {
	createAdmin: jest.fn(),
	createWarehouseManager: jest.fn(),
	validateUser: jest.fn(),
	login: jest.fn(),
	getUserInfo: jest.fn(),
	getUserInfoById: jest.fn(),
	updateWarehouseManagerPassword: jest.fn(),
	deleteWarehouseManager: jest.fn(),
	getAllWarehouseManagers: jest.fn(),
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
	const mockProduct: ProductModel = {
		id: 1,
		name: 'Test Product',
		description: 'Test Description',
		price: 100,
		quantity: 10,
		category: 'Electronics',
		sku: 'TEST123',
		isActive: true,
		createdById: 1,
		updatedById: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockUser = {
		id: 1,
		email: 'manager@example.com',
		name: 'Test Manager',
		role: 'WAREHOUSE_MANAGER' as Role,
		password: 'hashed',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockAdmin = {
		id: 2,
		email: 'admin@example.com',
		name: 'Admin User',
		role: 'ADMIN' as Role,
		password: 'hashed',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Создание продукта', () => {
		it('Должен успешно создать продукт', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
			productsRepository.create = jest.fn().mockResolvedValue(mockProduct);

			const result = await productsService.createProduct({
				name: 'Test Product',
				description: 'Test Description',
				price: 100,
				quantity: 10,
				category: 'Electronics',
				sku: 'TEST123',
				userEmail: 'manager@example.com',
			});

			expect(result).toEqual(mockProduct);
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.create).toHaveBeenCalledWith(expect.any(Product));
		});

		it('Должен выбросить HTTPError, если userEmail отсутствует', async () => {
			await expect(
				productsService.createProduct({
					name: 'Test Product',
					description: 'Test Description',
					price: 100,
					quantity: 10,
					category: 'Electronics',
					sku: 'TEST123',
				}),
			).rejects.toThrowError(new HTTPError(401, MESSAGES.UNAUTHORIZED));
			expect(usersService.getUserInfo).not.toHaveBeenCalled();
			expect(productsRepository.create).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если пользователь не найден', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(null);

			await expect(
				productsService.createProduct({
					name: 'Test Product',
					description: 'Test Description',
					price: 100,
					quantity: 10,
					category: 'Electronics',
					sku: 'TEST123',
					userEmail: 'nonexistent@example.com',
				}),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('nonexistent@example.com');
			expect(productsRepository.create).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если цена отрицательная', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);

			await expect(
				productsService.createProduct({
					name: 'Test Product',
					description: 'Test Description',
					price: -100,
					quantity: 10,
					category: 'Electronics',
					sku: 'TEST123',
					userEmail: 'manager@example.com',
				}),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.PRICE_NEGATIVE));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.create).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если количество отрицательное', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);

			await expect(
				productsService.createProduct({
					name: 'Test Product',
					description: 'Test Description',
					price: 100,
					quantity: -10,
					category: 'Electronics',
					sku: 'TEST123',
					userEmail: 'manager@example.com',
				}),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.create).not.toHaveBeenCalled();
		});

		it('Должен обрабатывать ошибки базы данных', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
			productsRepository.create = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(
				productsService.createProduct({
					name: 'Test Product',
					description: 'Test Description',
					price: 100,
					quantity: 10,
					category: 'Electronics',
					sku: 'TEST123',
					userEmail: 'manager@example.com',
				}),
			).rejects.toThrowError(new HTTPError(500, MESSAGES.SERVER_ERROR));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.create).toHaveBeenCalled();
		});
	});

	describe('Получение всех продуктов', () => {
		it('Должен вернуть продукты с фильтрами', async () => {
			productsRepository.findAll = jest.fn().mockResolvedValue([mockProduct]);
	
			const result = await productsService.getAllProducts({
				filters: { category: 'Electronics', isActive: true },
				sort: { sortBy: 'name', sortOrder: 'asc' },
			});
	
			expect(result).toEqual([mockProduct]);
			expect(productsRepository.findAll).toHaveBeenCalledWith({
				filters: {
					category: 'Electronics',
					isActive: true,
				},
				orderBy: { name: 'asc' },
			});
		});
	
		it('Должен обрабатывать ошибки базы данных', async () => {
			productsRepository.findAll = jest.fn().mockRejectedValue(new Error('DB Error'));
	
			await expect(productsService.getAllProducts()).rejects.toThrowError(
				new HTTPError(500, MESSAGES.SERVER_ERROR),
			);
			expect(productsRepository.findAll).toHaveBeenCalled();
		});
	});

	describe('Получение продуктов по менеджеру', () => {
		it('Должен вернуть продукты для менеджера', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByManager = jest.fn().mockResolvedValue([mockProduct]);

			const result = await productsService.getProductsByManager('manager@example.com');

			expect(result).toEqual([mockProduct]);
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.findByManager).toHaveBeenCalledWith(1);
		});

		it('Должен выбросить HTTPError, если email отсутствует', async () => {
			await expect(productsService.getProductsByManager(undefined)).rejects.toThrowError(
				new HTTPError(401, MESSAGES.UNAUTHORIZED),
			);
			expect(usersService.getUserInfo).not.toHaveBeenCalled();
			expect(productsRepository.findByManager).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если пользователь не найден', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(null);

			await expect(
				productsService.getProductsByManager('nonexistent@example.com'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('nonexistent@example.com');
			expect(productsRepository.findByManager).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если пользователь не является менеджером склада', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);

			await expect(productsService.getProductsByManager('admin@example.com')).rejects.toThrowError(
				new HTTPError(403, MESSAGES.FORBIDDEN),
			);
			expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findByManager).not.toHaveBeenCalled();
		});

		it('Должен обрабатывать ошибки базы данных', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByManager = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(
				productsService.getProductsByManager('manager@example.com'),
			).rejects.toThrowError(new HTTPError(500, MESSAGES.SERVER_ERROR));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.findByManager).toHaveBeenCalledWith(1);
		});
	});

	describe('Обновление продукта', () => {
		it('Должен успешно обновить продукт', async () => {
			productsRepository.update = jest.fn().mockResolvedValue({
				...mockProduct,
				name: 'Updated Product',
			});

			const result = await productsService.updateProduct(1, {
				name: 'Updated Product',
			});

			expect(result).toEqual({
				...mockProduct,
				name: 'Updated Product',
			});
			expect(productsRepository.update).toHaveBeenCalledWith(1, { name: 'Updated Product' });
		});

		it('Должен выбросить HTTPError для некорректного ID', async () => {
			await expect(
				productsService.updateProduct(NaN, { name: 'Updated Product' }),
			).rejects.toThrowError(new HTTPError(400, MESSAGES.INVALID_FORMAT));
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError для пустых данных обновления', async () => {
			await expect(productsService.updateProduct(1, {})).rejects.toThrowError(
				new HTTPError(422, MESSAGES.VALIDATION_FAILED),
			);
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError для отрицательной цены', async () => {
			await expect(productsService.updateProduct(1, { price: -100 })).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRICE_NEGATIVE),
			);
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError для отрицательного количества', async () => {
			await expect(productsService.updateProduct(1, { quantity: -10 })).rejects.toThrowError(
				new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE),
			);
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если продукт не найден', async () => {
			productsRepository.update = jest.fn().mockResolvedValue(null);

			await expect(
				productsService.updateProduct(999, { name: 'Updated Product' }),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));
			expect(productsRepository.update).toHaveBeenCalledWith(999, { name: 'Updated Product' });
		});

		it('Должен обрабатывать ошибки Prisma', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2025',
				clientVersion: '1.0',
			});
			productsRepository.update = jest.fn().mockRejectedValue(prismaError);

			await expect(
				productsService.updateProduct(1, { name: 'Updated Product' }),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));
			expect(productsRepository.update).toHaveBeenCalledWith(1, { name: 'Updated Product' });
		});
	});

	describe('Добавление количества продукта', () => {
		it('Должен успешно добавить количество продукта', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findById = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.update = jest.fn().mockResolvedValue({
				...mockProduct,
				quantity: 15,
				isActive: true,
			});

			const result = await productsService.addProductQuantity(1, 5, 'manager@example.com');

			expect(result).toEqual({
				...mockProduct,
				quantity: 15,
				isActive: true,
			});
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
			expect(productsRepository.update).toHaveBeenCalledWith(1, {
				quantity: 15,
				isActive: true,
				updatedById: 1,
			});
		});

		it('Должен выбросить HTTPError для некорректного ID', async () => {
			await expect(
				productsService.addProductQuantity(NaN, 5, 'manager@example.com'),
			).rejects.toThrowError(new HTTPError(400, MESSAGES.INVALID_FORMAT));
			expect(usersService.getUserInfo).not.toHaveBeenCalled();
			expect(productsRepository.findById).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError для отрицательного или нулевого количества', async () => {
			productsRepository.findById = jest.fn();
			productsRepository.update = jest.fn();
			usersService.getUserInfo = jest.fn();

			await expect(
				productsService.addProductQuantity(1, 0, 'manager@example.com'),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.QUANTITY_ZERO_OR_NEGATIVE));
			expect(usersService.getUserInfo).not.toHaveBeenCalled();
			expect(productsRepository.findById).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если userEmail отсутствует', async () => {
			await expect(productsService.addProductQuantity(1, 5, undefined)).rejects.toThrowError(
				new HTTPError(401, MESSAGES.UNAUTHORIZED),
			);
			expect(usersService.getUserInfo).not.toHaveBeenCalled();
			expect(productsRepository.findById).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если пользователь не является менеджером склада', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);

			await expect(
				productsService.addProductQuantity(1, 5, 'admin@example.com'),
			).rejects.toThrowError(new HTTPError(403, MESSAGES.FORBIDDEN));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findById).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если продукт не найден', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findById = jest.fn().mockResolvedValue(null);

			await expect(
				productsService.addProductQuantity(999, 5, 'manager@example.com'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.findById).toHaveBeenCalledWith(999);
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен обрабатывать ошибки Prisma', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findById = jest.fn().mockResolvedValue(mockProduct);
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2025',
				clientVersion: '1.0',
			});
			productsRepository.update = jest.fn().mockRejectedValue(prismaError);

			await expect(
				productsService.addProductQuantity(1, 5, 'manager@example.com'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
			expect(productsRepository.update).toHaveBeenCalled();
		});
	});

	describe('Удаление продукта', () => {
		it('Должен успешно удалить продукт', async () => {
			productsRepository.delete = jest.fn().mockResolvedValue(mockProduct);

			const result = await productsService.deleteProduct(1);

			expect(result).toEqual(mockProduct);
			expect(productsRepository.delete).toHaveBeenCalledWith(1);
		});

		it('Должен выбросить HTTPError для некорректного ID', async () => {
			await expect(productsService.deleteProduct(NaN)).rejects.toThrowError(
				new HTTPError(400, MESSAGES.INVALID_FORMAT),
			);
			expect(productsRepository.delete).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если продукт не найден', async () => {
			productsRepository.delete = jest.fn().mockResolvedValue(null);

			await expect(productsService.deleteProduct(999)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(productsRepository.delete).toHaveBeenCalledWith(999);
		});

		it('Должен обрабатывать ошибки Prisma', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2025',
				clientVersion: '1.0',
			});
			productsRepository.delete = jest.fn().mockRejectedValue(prismaError);

			await expect(productsService.deleteProduct(1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(productsRepository.delete).toHaveBeenCalledWith(1);
		});
	});

	describe('Покупка продукта', () => {
		it('Должен успешно купить продукт', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findById = jest.fn().mockResolvedValue(mockProduct);
			productsRepository.update = jest.fn().mockResolvedValue({
				...mockProduct,
				quantity: 5,
				isActive: true,
			});

			const result = await productsService.purchaseProduct(1, 5, 'admin@example.com');

			expect(result).toEqual({
				...mockProduct,
				quantity: 5,
				isActive: true,
			});
			expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
			expect(productsRepository.update).toHaveBeenCalledWith(1, {
				quantity: 5,
				isActive: true,
				updatedById: 2,
			});
		});

		it('Должен выбросить HTTPError для некорректного ID', async () => {
			await expect(
				productsService.purchaseProduct(NaN, 5, 'admin@example.com'),
			).rejects.toThrowError(new HTTPError(400, MESSAGES.INVALID_FORMAT));
			expect(usersService.getUserInfo).not.toHaveBeenCalled();
			expect(productsRepository.findById).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError для отрицательного или нулевого количества', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);

			await expect(productsService.purchaseProduct(1, 0, 'admin@example.com')).rejects.toThrowError(
				new HTTPError(422, MESSAGES.QUANTITY_ZERO_OR_NEGATIVE),
			);
			expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findById).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если userEmail отсутствует', async () => {
			await expect(productsService.purchaseProduct(1, 5, undefined)).rejects.toThrowError(
				new HTTPError(401, MESSAGES.UNAUTHORIZED),
			);
			expect(usersService.getUserInfo).not.toHaveBeenCalled();
			expect(productsRepository.findById).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если пользователь не является админом или суперадмином', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);

			await expect(
				productsService.purchaseProduct(1, 5, 'manager@example.com'),
			).rejects.toThrowError(new HTTPError(403, MESSAGES.FORBIDDEN));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('manager@example.com');
			expect(productsRepository.findById).not.toHaveBeenCalled();
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если продукт не найден', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findById = jest.fn().mockResolvedValue(null);

			await expect(
				productsService.purchaseProduct(999, 5, 'admin@example.com'),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findById).toHaveBeenCalledWith(999);
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если продукт отсутствует на складе', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findById = jest.fn().mockResolvedValue({ ...mockProduct, quantity: 0 });

			await expect(productsService.purchaseProduct(1, 5, 'admin@example.com')).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK),
			);
			expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если количество превышает запас', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findById = jest.fn().mockResolvedValue(mockProduct);

			await expect(
				productsService.purchaseProduct(1, 15, 'admin@example.com'),
			).rejects.toThrowError(new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK));
			expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
			expect(productsRepository.update).not.toHaveBeenCalled();
		});

		it('Должен обрабатывать ошибки Prisma', async () => {
			usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);
			productsRepository.findById = jest.fn().mockResolvedValue(mockProduct);
			const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
				code: 'P2025',
				clientVersion: '1.0',
			});
			productsRepository.update = jest.fn().mockRejectedValue(prismaError);

			await expect(productsService.purchaseProduct(1, 5, 'admin@example.com')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
			expect(productsRepository.update).toHaveBeenCalled();
		});
	});

	describe('Получение статуса продукта', () => {
		it('Должен вернуть статус продукта', async () => {
			productsRepository.findById = jest.fn().mockResolvedValue(mockProduct);

			const result = await productsService.getProductStatus(1);

			expect(result).toEqual({
				id: 1,
				name: 'Test Product',
				quantity: 10,
				isActive: true,
				message: '',
			});
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
		});

		it('Должен вернуть сообщение о нулевом запасе, если количество равно нулю', async () => {
			productsRepository.findById = jest.fn().mockResolvedValue({ ...mockProduct, quantity: 0 });

			const result = await productsService.getProductStatus(1);

			expect(result).toEqual({
				id: 1,
				name: 'Test Product',
				quantity: 0,
				isActive: true,
				message: MESSAGES.PRODUCT_OUT_OF_STOCK,
			});
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
		});

		it('Должен выбросить HTTPError для некорректного ID', async () => {
			await expect(productsService.getProductStatus(NaN)).rejects.toThrowError(
				new HTTPError(400, MESSAGES.INVALID_FORMAT),
			);
			expect(productsRepository.findById).not.toHaveBeenCalled();
		});

		it('Должен выбросить HTTPError, если продукт не найден', async () => {
			productsRepository.findById = jest.fn().mockResolvedValue(null);

			await expect(productsService.getProductStatus(999)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(productsRepository.findById).toHaveBeenCalledWith(999);
		});

		it('Должен обрабатывать ошибки базы данных', async () => {
			productsRepository.findById = jest.fn().mockRejectedValue(new Error('DB Error'));

			await expect(productsService.getProductStatus(1)).rejects.toThrowError(
				new HTTPError(500, MESSAGES.SERVER_ERROR),
			);
			expect(productsRepository.findById).toHaveBeenCalledWith(1);
		});
	});
});
