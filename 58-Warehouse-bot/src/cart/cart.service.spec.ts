import { Container } from 'inversify';
import { CartService } from './cart.service';
import { ICartRepository } from './cart.repository.interface';
import {
	IProductsRepository,
	ProductWithRelations,
} from '../products/products.repository.interface';
import { TYPES } from '../types';
import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { Cart } from './cart.entity';
import { CartModel } from '@prisma/client';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { ProductStatus } from '../common/enums/product-status.enum';
import { Prisma } from '@prisma/client';
import { CartWithProduct } from './cart.repository.interface';

const PrismaServiceMock = {
	client: {
		$transaction: jest.fn((callback) => callback({})),
	},
	findUnique: jest.fn(),
};

const CartRepositoryMock: jest.Mocked<ICartRepository> = {
	addCartItem: jest.fn(),
	getCartItems: jest.fn(),
	checkoutCartItems: jest.fn(),
	findCartItem: jest.fn(),
	removeCartItem: jest.fn(),
	removeAllCartItems: jest.fn(),
};

const ProductsRepositoryMock: jest.Mocked<IProductsRepository> = {
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
let cartService: CartService;
let cartRepository: jest.Mocked<ICartRepository>;
let productsRepository: jest.Mocked<IProductsRepository>;

beforeAll(() => {
	container.bind<CartService>(TYPES.CartService).to(CartService);
	container.bind<ICartRepository>(TYPES.CartRepository).toConstantValue(CartRepositoryMock);
	container
		.bind<IProductsRepository>(TYPES.ProductsRepository)
		.toConstantValue(ProductsRepositoryMock);
	container.bind(TYPES.PrismaService).toConstantValue(PrismaServiceMock);

	cartService = container.get<CartService>(TYPES.CartService);
	cartRepository = container.get<jest.Mocked<ICartRepository>>(TYPES.CartRepository);
	productsRepository = container.get<jest.Mocked<IProductsRepository>>(TYPES.ProductsRepository);
});

describe('Сервис корзины', () => {
	const mockProduct: ProductWithRelations = {
		id: 1,
		name: 'Тестовый Товар',
		description: null,
		price: 100,
		quantity: 10,
		sku: 'TEST123',
		status: ProductStatus.AVAILABLE,
		isActive: true,
		isDeleted: false,
		createdById: 1,
		updatedById: null,
		cityId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		categories: [{ id: 1, name: 'Категория 1' }],
		city: null,
	};

	const mockOutOfStockProduct: ProductWithRelations = {
		...mockProduct,
		id: 2,
		quantity: 0,
		sku: 'OUT123',
		status: ProductStatus.OUT_OF_STOCK,
		categories: [{ id: 2, name: 'Категория 2' }],
	};

	const mockCartItem: CartModel = {
		id: 1,
		userId: 1,
		productId: 1,
		quantity: 2,
		price: 100,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockCartWithProduct: CartWithProduct[] = [
		{
			id: 1,
			userId: 1,
			productId: 1,
			quantity: 2,
			price: 100,
			createdAt: new Date(),
			updatedAt: new Date(),
			product: {
				id: 1,
				name: 'Тестовый Товар',
				description: null,
				price: 100,
				quantity: 10,
				sku: 'TEST123',
				status: ProductStatus.AVAILABLE,
				isActive: true,
				isDeleted: false,
				createdById: 1,
				updatedById: null,
				cityId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				categories: [{ id: 1, name: 'Категория 1' }],
				city: null,
			},
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
		PrismaServiceMock.findUnique.mockResolvedValue(null);
		PrismaServiceMock.client.$transaction.mockImplementation((callback) => callback({}));
	});

	describe('Добавление в корзину', () => {
		const cartAddDto: CartAddDto = { productId: 1, quantity: 2 };
		const userId = 1;

		it('Должен успешно добавить товар в корзину', async () => {
			productsRepository.findProductByKeyOrThrow.mockResolvedValue(mockProduct);
			cartRepository.addCartItem.mockResolvedValue(mockCartItem);

			const result = await cartService.addCartItem(userId, cartAddDto);

			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				cartAddDto.productId,
			);
			expect(cartRepository.addCartItem).toHaveBeenCalledWith(expect.any(Cart));
			expect(result).toEqual({
				id: mockCartItem.id,
				productId: mockCartItem.productId,
				quantity: mockCartItem.quantity,
				price: mockCartItem.price,
				createdAt: mockCartItem.createdAt.toISOString(),
				updatedAt: mockCartItem.updatedAt.toISOString(),
				product: { name: mockProduct.name },
			});
		});

		it('Должен выбросить ошибку 404, если товар не найден', async () => {
			productsRepository.findProductByKeyOrThrow.mockRejectedValue(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);

			await expect(cartService.addCartItem(userId, cartAddDto)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND),
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				cartAddDto.productId,
			);
			expect(cartRepository.addCartItem).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 422, если товар недоступен', async () => {
			productsRepository.findProductByKeyOrThrow.mockResolvedValue(mockOutOfStockProduct);

			await expect(cartService.addCartItem(userId, cartAddDto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK),
			);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				cartAddDto.productId,
			);
			expect(cartRepository.addCartItem).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			productsRepository.findProductByKeyOrThrow.mockResolvedValue(mockProduct);
			cartRepository.addCartItem.mockRejectedValue(prismaError);

			await expect(cartService.addCartItem(userId, cartAddDto)).rejects.toThrowError(prismaError);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith(
				'id',
				cartAddDto.productId,
			);
			expect(cartRepository.addCartItem).toHaveBeenCalledWith(expect.any(Cart));
		});
	});

	describe('Получение корзины', () => {
		const userId = 1;

		it('Должен успешно вернуть содержимое корзины с общей суммой', async () => {
			cartRepository.getCartItems.mockResolvedValue(mockCartWithProduct);

			const result = await cartService.getCartItems(userId);

			expect(cartRepository.getCartItems).toHaveBeenCalledWith(userId);
			expect(result).toEqual({
				items: [
					{
						id: 1,
						productId: 1,
						quantity: 2,
						price: mockCartWithProduct[0].price,
						createdAt: expect.any(String),
						updatedAt: expect.any(String),
						product: { name: 'Тестовый Товар' },
					},
				],
				total: mockCartWithProduct[0].price * mockCartWithProduct[0].quantity,
			});
		});

		it('Должен вернуть пустую корзину с нулевой суммой', async () => {
			cartRepository.getCartItems.mockResolvedValue([]);

			const result = await cartService.getCartItems(userId);

			expect(cartRepository.getCartItems).toHaveBeenCalledWith(userId);
			expect(result).toEqual({ items: [], total: 0 });
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			cartRepository.getCartItems.mockRejectedValue(prismaError);

			await expect(cartService.getCartItems(userId)).rejects.toThrowError(prismaError);
			expect(cartRepository.getCartItems).toHaveBeenCalledWith(userId);
		});
	});

	describe('Оформление заказа', () => {
		const userId = 1;
		const cartCheckoutDto: CartCheckoutDto = {
			items: [
				{ productId: 1, quantity: 2 },
				{ productId: 2, quantity: 1 },
			],
		};
		const mockProduct2: ProductWithRelations = {
			id: 2,
			name: 'Тестовый Товар 2',
			description: null,
			price: 50,
			quantity: 5,
			sku: 'TEST456',
			status: ProductStatus.AVAILABLE,
			isActive: true,
			isDeleted: false,
			createdById: 1,
			updatedById: null,
			cityId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			categories: [{ id: 2, name: 'Категория 2' }],
			city: null,
		};
		const cartItems: CartWithProduct[] = [
			{
				id: 1,
				userId,
				productId: 1,
				quantity: 2,
				price: 100,
				createdAt: new Date(),
				updatedAt: new Date(),
				product: mockProduct,
			},
			{
				id: 2,
				userId,
				productId: 2,
				quantity: 1,
				price: 50,
				createdAt: new Date(),
				updatedAt: new Date(),
				product: mockProduct2,
			},
		];

		it('Должен успешно оформить заказ', async () => {
			cartRepository.getCartItems.mockResolvedValue(cartItems);
			productsRepository.findProductByKeyOrThrow
				.mockResolvedValueOnce(mockProduct)
				.mockResolvedValueOnce(mockProduct2);
			productsRepository.updateProduct.mockResolvedValue({} as any);
			cartRepository.checkoutCartItems.mockResolvedValue(cartItems);
			PrismaServiceMock.client.$transaction.mockImplementation((callback) => callback({}));

			const result = await cartService.checkoutCartItems(userId, cartCheckoutDto);

			expect(cartRepository.getCartItems).toHaveBeenCalledWith(userId);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledTimes(2);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith('id', 1);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith('id', 2);
			expect(productsRepository.updateProduct).toHaveBeenCalledTimes(2);
			expect(cartRepository.checkoutCartItems).toHaveBeenCalledWith(userId, [
				{ productId: 1, quantity: 2 },
				{ productId: 2, quantity: 1 },
			]);
			expect(result).toEqual(cartItems);
		});

		it('Должен выбросить ошибку 404, если элемент корзины не найден', async () => {
			cartRepository.getCartItems.mockResolvedValue([cartItems[0]]);
			const modifiedCartCheckoutDto: CartCheckoutDto = {
				items: [{ productId: 2, quantity: 1 }],
			};
			PrismaServiceMock.client.$transaction.mockImplementation((callback) => callback({}));

			await expect(
				cartService.checkoutCartItems(userId, modifiedCartCheckoutDto),
			).rejects.toThrowError(new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND));
			expect(cartRepository.getCartItems).toHaveBeenCalledWith(userId);
			expect(productsRepository.findProductByKeyOrThrow).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 422, если недостаточно товара в корзине', async () => {
			cartRepository.getCartItems.mockResolvedValue([
				{ ...cartItems[0], quantity: 1 },
				cartItems[1],
			]);
			PrismaServiceMock.client.$transaction.mockImplementation((callback) => callback({}));

			await expect(cartService.checkoutCartItems(userId, cartCheckoutDto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.INSUFFICIENT_QUANTITY_IN_CART),
			);
			expect(cartRepository.getCartItems).toHaveBeenCalledWith(userId);
			expect(productsRepository.findProductByKeyOrThrow).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку 422, если товар недоступен', async () => {
			cartRepository.getCartItems.mockResolvedValue(cartItems);
			productsRepository.findProductByKeyOrThrow
				.mockResolvedValueOnce(mockOutOfStockProduct)
				.mockResolvedValueOnce(mockProduct2);
			PrismaServiceMock.client.$transaction.mockImplementation((callback) => callback({}));

			await expect(cartService.checkoutCartItems(userId, cartCheckoutDto)).rejects.toThrowError(
				new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK),
			);
			expect(cartRepository.getCartItems).toHaveBeenCalledWith(userId);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledWith('id', 1);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			cartRepository.getCartItems.mockResolvedValue(cartItems);
			productsRepository.findProductByKeyOrThrow
				.mockResolvedValueOnce(mockProduct)
				.mockResolvedValueOnce(mockProduct2);
			productsRepository.updateProduct.mockRejectedValue(prismaError);
			PrismaServiceMock.client.$transaction.mockImplementation((callback) => callback({}));

			await expect(cartService.checkoutCartItems(userId, cartCheckoutDto)).rejects.toThrowError(
				prismaError,
			);
			expect(cartRepository.getCartItems).toHaveBeenCalledWith(userId);
			expect(productsRepository.findProductByKeyOrThrow).toHaveBeenCalledTimes(2);
			expect(productsRepository.updateProduct).toHaveBeenCalled();
		});
	});

	describe('Удаление из корзины', () => {
		const userId = 1;
		const productId = 1;

		it('Должен успешно удалить товар из корзины', async () => {
			cartRepository.findCartItem.mockResolvedValue(mockCartItem);
			cartRepository.removeCartItem.mockResolvedValue(undefined);

			await cartService.removeCartItem(userId, productId);

			expect(cartRepository.findCartItem).toHaveBeenCalledWith(userId, productId);
			expect(cartRepository.removeCartItem).toHaveBeenCalledWith(userId, productId);
		});

		it('Должен выбросить ошибку 404, если элемент корзины не найден', async () => {
			cartRepository.findCartItem.mockResolvedValue(null);

			await expect(cartService.removeCartItem(userId, productId)).rejects.toThrowError(
				new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND),
			);
			expect(cartRepository.findCartItem).toHaveBeenCalledWith(userId, productId);
			expect(cartRepository.removeCartItem).not.toHaveBeenCalled();
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			cartRepository.findCartItem.mockResolvedValue(mockCartItem);
			cartRepository.removeCartItem.mockRejectedValue(prismaError);

			await expect(cartService.removeCartItem(userId, productId)).rejects.toThrowError(prismaError);
			expect(cartRepository.findCartItem).toHaveBeenCalledWith(userId, productId);
			expect(cartRepository.removeCartItem).toHaveBeenCalledWith(userId, productId);
		});
	});

	describe('Очистка корзины', () => {
		const userId = 1;

		it('Должен успешно очистить корзину', async () => {
			cartRepository.removeAllCartItems.mockResolvedValue();

			await cartService.removeAllCartItems(userId);

			expect(cartRepository.removeAllCartItems).toHaveBeenCalledWith(userId);
		});

		it('Должен выбросить ошибку при сбое базы данных', async () => {
			const prismaError = new Prisma.PrismaClientKnownRequestError('DB Error', {
				code: 'P2002',
				clientVersion: '',
			});
			cartRepository.removeAllCartItems.mockRejectedValue(prismaError);

			await expect(cartService.removeAllCartItems(userId)).rejects.toThrowError(prismaError);
			expect(cartRepository.removeAllCartItems).toHaveBeenCalledWith(userId);
		});
	});
});
