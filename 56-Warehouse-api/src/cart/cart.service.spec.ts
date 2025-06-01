import { Container } from 'inversify';
import { IUsersService } from '../users/users.service.interface';
import { ICartService, CartWithProduct } from './cart.service.interface';
import { ICartRepository } from './cart.repository.interface';
import { IProductsRepository } from '../products/products.repository.interface';
import { TYPES } from '../types';
import { CartService } from './cart.service';
import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { CartModel } from '@prisma/client';

const CartRepositoryMock: ICartRepository = {
	addToCart: jest.fn(),
	getCart: jest.fn(),
	checkout: jest.fn(),
	removeFromCart: jest.fn(),
};

const ProductsRepositoryMock: IProductsRepository = {
	create: jest.fn(),
	findById: jest.fn(),
	findByIdOrThrow: jest.fn(),
	findBySku: jest.fn(),
	findAll: jest.fn(),
	findByCreator: jest.fn(),
	findStock: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
};

const UsersServiceMock: IUsersService = {
	createUser: jest.fn(),
	login: jest.fn(),
	getUserInfoByEmail: jest.fn(),
	getUserInfoById: jest.fn(),
	getAllWarehouseManagers: jest.fn(),
	updateWarehouseManagerPassword: jest.fn(),
	deleteWarehouseManager: jest.fn(),
};

const container = new Container();
let cartRepository: ICartRepository;
let productsRepository: IProductsRepository;
let usersService: IUsersService;
let cartService: ICartService;

beforeAll(() => {
	container.bind<ICartService>(TYPES.CartService).to(CartService);
	container.bind<ICartRepository>(TYPES.CartRepository).toConstantValue(CartRepositoryMock);
	container
		.bind<IProductsRepository>(TYPES.ProductsRepository)
		.toConstantValue(ProductsRepositoryMock);
	container.bind<IUsersService>(TYPES.UsersService).toConstantValue(UsersServiceMock);

	cartRepository = container.get<ICartRepository>(TYPES.CartRepository);
	productsRepository = container.get<IProductsRepository>(TYPES.ProductsRepository);
	usersService = container.get<IUsersService>(TYPES.UsersService);
	cartService = container.get<ICartService>(TYPES.CartService);
});

describe('Сервис корзины', () => {
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

	const mockInsufficientStockProduct = {
		id: 4,
		name: 'Смартфон Samsung Galaxy',
		description: '6.5", 128GB',
		price: 799.99,
		quantity: 5,
		category: 'Электроника',
		sku: 'SM-SG-001',
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

	const mockCartItem: CartModel = {
		id: 1,
		userId: 1,
		productId: 1,
		quantity: 2,
		createdAt: new Date('2025-05-27T19:38:01.075Z'),
		updatedAt: new Date('2025-05-27T19:38:01.075Z'),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Добавление товара в корзину', () => {
		it('Должен успешно добавить товар в корзину', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockProduct);
			cartRepository.addToCart = jest.fn().mockResolvedValue(mockCartItem);

			const dto: CartAddDto = { productId: 1, quantity: 2 };
			const result = await cartService.addToCart('test@example.com', dto);

			expect(result).toEqual(mockCartItem);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(cartRepository.addToCart).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: mockUser.id,
					productId: dto.productId,
					quantity: dto.quantity,
				}),
			);
		});

		it('Должен выбросить ошибку 422, если productId невалиден', async () => {
			const dto: CartAddDto = { productId: 0, quantity: 2 };
			await expect(cartService.addToCart('test@example.com', dto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INVALID_ID),
			);
			expect(usersService.getUserInfoByEmail).not.toHaveBeenCalled();
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(cartRepository.addToCart).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 422, если товар отсутствует на складе', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockOutOfStockProduct);

			const dto: CartAddDto = { productId: 3, quantity: 1 };
			await expect(cartService.addToCart('test@example.com', dto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(3);
			expect(cartRepository.addToCart).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 422, если недостаточно товара на складе', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest
				.fn()
				.mockResolvedValue(mockInsufficientStockProduct);

			const dto: CartAddDto = { productId: 4, quantity: 10 };
			await expect(cartService.addToCart('test@example.com', dto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(4);
			expect(cartRepository.addToCart).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			const dto: CartAddDto = { productId: 999, quantity: 1 };
			await expect(cartService.addToCart('test@example.com', dto)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(999);
			expect(cartRepository.addToCart).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если email пустой', async () => {
			const dto: CartAddDto = { productId: 1, quantity: 2 };
			await expect(cartService.addToCart('', dto)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).not.toHaveBeenCalled();
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(cartRepository.addToCart).not.toHaveBeenCalled();
		});
	});

	describe('Получение корзины', () => {
		it('Должен успешно вернуть корзину пользователя', async () => {
			const mockCartWithProduct: CartWithProduct = {
				...mockCartItem,
				product: { name: mockProduct.name, price: mockProduct.price },
			};
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			cartRepository.getCart = jest.fn().mockResolvedValue([mockCartWithProduct]);

			const result = await cartService.getCart('test@example.com');

			expect(result).toEqual({
				items: [
					{
						id: mockCartItem.id,
						productId: mockCartItem.productId,
						quantity: mockCartItem.quantity,
						price: mockProduct.price,
						createdAt: mockCartItem.createdAt.toISOString(),
						updatedAt: mockCartItem.updatedAt.toISOString(),
					},
				],
				total: mockProduct.price * mockCartItem.quantity,
			});
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(cartRepository.getCart).toHaveBeenCalledWith(mockUser.id);
		});

		it('Должен вернуть пустую корзину, если товаров нет', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			cartRepository.getCart = jest.fn().mockResolvedValue([]);

			const result = await cartService.getCart('test@example.com');

			expect(result).toEqual({ items: [], total: 0 });
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(cartRepository.getCart).toHaveBeenCalledWith(mockUser.id);
		});

		it('Должен корректно вычислить итоговую сумму для нескольких товаров', async () => {
			const mockCartItems: CartWithProduct[] = [
				{
					...mockCartItem,
					product: { name: mockProduct.name, price: mockProduct.price },
				},
				{
					id: 2,
					userId: 1,
					productId: 2,
					quantity: 1,
					createdAt: new Date('2025-05-27T19:38:01.099Z'),
					updatedAt: new Date('2025-05-27T19:38:01.099Z'),
					product: { name: 'Дополнительный товар', price: 500 },
				},
			];

			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			cartRepository.getCart = jest.fn().mockResolvedValue(mockCartItems);

			const result = await cartService.getCart('test@example.com');

			expect(result).toEqual({
				items: [
					{
						id: mockCartItems[0].id,
						productId: mockCartItems[0].productId,
						quantity: mockCartItems[0].quantity,
						price: mockCartItems[0].product.price,
						createdAt: mockCartItems[0].createdAt.toISOString(),
						updatedAt: mockCartItems[0].updatedAt.toISOString(),
					},
					{
						id: mockCartItems[1].id,
						productId: mockCartItems[1].productId,
						quantity: mockCartItems[1].quantity,
						price: mockCartItems[1].product.price,
						createdAt: mockCartItems[1].createdAt.toISOString(),
						updatedAt: mockCartItems[1].updatedAt.toISOString(),
					},
				],
				total:
					mockCartItems[0].product.price * mockCartItems[0].quantity +
					mockCartItems[1].product.price * mockCartItems[1].quantity,
			});
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(cartRepository.getCart).toHaveBeenCalledWith(mockUser.id);
		});

		it('Должен выбросить ошибку 404, если email пустой', async () => {
			await expect(cartService.getCart('')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).not.toHaveBeenCalled();
			expect(cartRepository.getCart).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если пользователь не найден', async () => {
			usersService.getUserInfoByEmail = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.USER_NOT_FOUND));

			await expect(cartService.getCart('nonexistent@example.com')).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('nonexistent@example.com');
			expect(cartRepository.getCart).not.toHaveBeenCalled();
		});
	});

	describe('Оформление заказа', () => {
		it('Должен успешно оформить заказ', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockProduct);
			cartRepository.checkout = jest.fn().mockResolvedValue([mockCartItem]);

			const dto: CartCheckoutDto = { items: [{ productId: 1, quantity: 2 }] };
			const result = await cartService.checkout('test@example.com', dto);

			expect(result).toEqual([mockCartItem]);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(cartRepository.checkout).toHaveBeenCalledWith(mockUser.id, dto);
		});

		it('Должен успешно оформить заказ с пустым списком товаров', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			cartRepository.checkout = jest.fn().mockResolvedValue([]);

			const dto: CartCheckoutDto = { items: [] };
			const result = await cartService.checkout('test@example.com', dto);

			expect(result).toEqual([]);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(cartRepository.checkout).toHaveBeenCalledWith(mockUser.id, dto);
		});

		it('Должен выбросить ошибку 422, если productId в списке товаров невалиден', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);

			const dto: CartCheckoutDto = { items: [{ productId: 0, quantity: 2 }] };
			await expect(cartService.checkout('test@example.com', dto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INVALID_ID),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(cartRepository.checkout).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 422, если товар отсутствует на складе', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockOutOfStockProduct);

			const dto: CartCheckoutDto = { items: [{ productId: 3, quantity: 1 }] };
			await expect(cartService.checkout('test@example.com', dto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(3);
			expect(cartRepository.checkout).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 422, если недостаточно товара на складе', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest
				.fn()
				.mockResolvedValue(mockInsufficientStockProduct);

			const dto: CartCheckoutDto = { items: [{ productId: 4, quantity: 10 }] };
			await expect(cartService.checkout('test@example.com', dto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(4);
			expect(cartRepository.checkout).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			const dto: CartCheckoutDto = { items: [{ productId: 999, quantity: 1 }] };
			await expect(cartService.checkout('test@example.com', dto)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(999);
			expect(cartRepository.checkout).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если email пустой', async () => {
			const dto: CartCheckoutDto = { items: [{ productId: 1, quantity: 2 }] };
			await expect(cartService.checkout('', dto)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).not.toHaveBeenCalled();
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(cartRepository.checkout).not.toHaveBeenCalled();
		});
	});

	describe('Удаление товара из корзины', () => {
		it('Должен успешно удалить товар из корзины', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockProduct);
			cartRepository.removeFromCart = jest.fn().mockResolvedValue(undefined);

			await cartService.removeFromCart('test@example.com', 1);

			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(cartRepository.removeFromCart).toHaveBeenCalledWith(mockUser.id, 1);
		});

		it('Должен выбросить ошибку 422, если productId невалиден', async () => {
			await expect(cartService.removeFromCart('test@example.com', 0)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INVALID_ID),
			);
			expect(usersService.getUserInfoByEmail).not.toHaveBeenCalled();
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(cartRepository.removeFromCart).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND));

			await expect(cartService.removeFromCart('test@example.com', 999)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(999);
			expect(cartRepository.removeFromCart).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если email пустой', async () => {
			await expect(cartService.removeFromCart('', 1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.USER_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).not.toHaveBeenCalled();
			expect(productsRepository.findByIdOrThrow).not.toHaveBeenCalled();
			expect(cartRepository.removeFromCart).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 404, если товар не найден в корзине', async () => {
			usersService.getUserInfoByEmail = jest.fn().mockResolvedValue(mockUser);
			productsRepository.findByIdOrThrow = jest.fn().mockResolvedValue(mockProduct);
			cartRepository.removeFromCart = jest
				.fn()
				.mockRejectedValue(new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND));

			await expect(cartService.removeFromCart('test@example.com', 1)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND),
			);
			expect(usersService.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
			expect(productsRepository.findByIdOrThrow).toHaveBeenCalledWith(1);
			expect(cartRepository.removeFromCart).toHaveBeenCalledWith(mockUser.id, 1);
		});
	});
});