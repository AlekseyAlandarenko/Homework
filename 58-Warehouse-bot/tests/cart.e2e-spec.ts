import { App } from '../src/app';
import { boot } from '../src/main';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import {
	cleanUp,
	createTestWarehouseManager,
	createTestProduct,
	loginUser,
	ProductPayload,
	UserCredentials,
} from './testUtils';
import { MESSAGES } from '../src/common/messages';
import { ProductStatus } from '../src/common/enums/product-status.enum';

let application: App;
let prisma: PrismaClient;
let adminToken: string;
let adminUserId: number;
let managerId: number;
let managerToken: string;
let addressId: number;
let cityId: number;
let categoryId: number;

interface CartPayload {
	productId: number;
	quantity: number;
}

interface CheckoutPayload {
	items: CartPayload[];
	addressId: number;
}

beforeAll(async () => {
	const { app } = await boot;
	application = app;
	prisma = new PrismaClient();

	await cleanUp(prisma);

	const adminCredentials: UserCredentials = {
		email: 'superadmin@example.com',
		password: 'superadminPassword123',
	};

	const adminUser = await prisma.userModel.findUnique({
		where: { email: 'superadmin@example.com' },
	});
	if (!adminUser) {
		throw new Error('Admin user not found');
	}
	adminUserId = adminUser.id;

	const { token, status } = await loginUser(application.app, adminCredentials);
	expect(status).toBe(200);
	adminToken = token;

	const city = await prisma.cityModel.create({
		data: { name: `Тестовый Город-${Date.now()}` },
	});
	cityId = city.id;

	const category = await prisma.cityModel.create({
		data: { name: `Тестовая Категория-${Date.now()}` },
	});
	categoryId = category.id;

	const address = await prisma.addressModel.create({
		data: {
			userId: adminUserId,
			cityId: cityId,
			address: 'Тестовая улица, 1',
			isDefault: true,
		},
	});
	addressId = address.id;

	const result = await createTestWarehouseManager(application.app, adminToken);
	managerId = result.managerId;
	managerToken = result.managerToken;

	const manager = await prisma.userModel.findUnique({ where: { id: managerId } });
	if (!manager) {
		throw new Error(`Manager with ID ${managerId} not found in database`);
	}
});

afterEach(async () => {
	await cleanUp(prisma);
});

afterAll(async () => {
	await prisma.$disconnect();
	await application.close();
});

describe('Тестирование корзины (E2E)', () => {
	let product: any;

	beforeEach(async () => {
		await cleanUp(prisma);

		const city = await prisma.cityModel.create({
			data: { name: `Тестовый Город-${Date.now()}` },
		});
		cityId = city.id;

		const category = await prisma.categoryModel.create({
			data: { name: `Тестовая Категория-${Date.now()}` },
		});
		categoryId = category.id;

		const address = await prisma.addressModel.create({
			data: {
				userId: adminUserId,
				cityId: cityId,
				address: 'Тестовая улица, 1',
				isDefault: true,
			},
		});
		addressId = address.id;

		const productData: ProductPayload = {
			name: 'Тестовый продукт для корзины',
			description: 'Описание тестового продукта',
			price: 99.99,
			quantity: 10,
			sku: `CART-TEST-${Date.now()}`,
			status: ProductStatus.AVAILABLE,
			cityId: city.id,
			categoryIds: [category.id],
			createdById: managerId,
		};
		const res = await createTestProduct(application.app, adminToken, managerId, productData);
		expect(res.status).toBe(201);
		product = res.data;
	});

	describe('Добавление товара в корзину (POST /cart)', () => {
		const validCartData: CartPayload = {
			productId: 0,
			quantity: 2,
		};

		it('Должен успешно добавить товар в корзину', async () => {
			const res = await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCartData, productId: product.id });

			expect(res.statusCode).toBe(201);
			expect(res.body.message).toBe(MESSAGES.CART_ITEM_ADDED);
			expect(res.body.data).toMatchObject({
				id: expect.any(Number),
				productId: product.id,
				quantity: 2,
				price: product.price,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
			});
		});

		it('Должен увеличить количество при повторном добавлении того же товара', async () => {
			await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCartData, productId: product.id });

			const res = await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCartData, productId: product.id, quantity: 3 });

			expect(res.statusCode).toBe(201);
			expect(res.body.message).toBe(MESSAGES.CART_ITEM_ADDED);
			expect(res.body.data).toMatchObject({
				productId: product.id,
				quantity: 5,
				price: product.price,
			});
		});

		it('Должен выбросить ошибку 401, если токен отсутствует', async () => {
			const res = await request(application.app)
				.post('/cart')
				.send({ ...validCartData, productId: product.id });

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
		});

		it('Должен выбросить ошибку 401, если токен некорректен', async () => {
			const res = await request(application.app)
				.post('/cart')
				.set('Authorization', 'Bearer invalid-token')
				.send({ ...validCartData, productId: product.id });

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
		});

		it('Должен выбросить ошибку 422, если количество товара недостаточно', async () => {
			const res = await request(application.app)
				.post('/cart')
				.set('UsageLimit', 'none')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCartData, productId: product.id, quantity: 15 });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
		});

		it('Должен выбросить ошибку 422, если количество отрицательное', async () => {
			const res = await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCartData, productId: product.id, quantity: -1 });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.QUANTITY_NOT_POSITIVE);
		});

		it('Должен выбросить ошибку 404, если продукт не существует', async () => {
			const res = await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCartData, productId: 9999 });

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
		});
	});

	describe('Получение содержимого корзины (GET /cart)', () => {
		it('Должен успешно получить содержимое корзины', async () => {
			await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ productId: product.id, quantity: 2 });

			const res = await request(application.app)
				.get('/cart')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.message).toBe(MESSAGES.CART_RETRIEVED);
			expect(res.body.data.items).toHaveLength(1);
			expect(res.body.data.items[0]).toMatchObject({
				id: expect.any(Number),
				productId: product.id,
				quantity: 2,
				price: product.price,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
				product: { name: product.name },
			});
			expect(res.body.data.total).toBe(2 * product.price);
		});

		it('Должен вернуть пустую корзину, если товаров нет', async () => {
			const res = await request(application.app)
				.get('/cart')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.message).toBe(MESSAGES.CART_RETRIEVED);
			expect(res.body.data.items).toHaveLength(0);
			expect(res.body.data.total).toBe(0);
		});

		it('Должен выбросить ошибку 401, если токен отсутствует', async () => {
			const res = await request(application.app).get('/cart');

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
		});
	});

	describe('Оформление заказа (POST /cart/checkout)', () => {
		const validCheckoutData: CheckoutPayload = {
			items: [{ productId: 0, quantity: 2 }],
			addressId: 0,
		};

		it('Должен успешно оформить заказ', async () => {
			await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ productId: product.id, quantity: 2 });

			const res = await request(application.app)
				.post('/cart/checkout')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCheckoutData, items: [{ productId: product.id, quantity: 2 }], addressId });

			expect(res.statusCode).toBe(200);
			expect(res.body.message).toBe(MESSAGES.CHECKOUT_COMPLETED);
			expect(res.body.data.items).toHaveLength(1);
			expect(res.body.data.items[0]).toMatchObject({
				productId: product.id,
				quantity: 2,
			});

			const productAfterCheckout = await request(application.app)
				.get(`/products/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`);

			expect(productAfterCheckout.statusCode).toBe(200);
			expect(productAfterCheckout.body.data.quantity).toBe(8);
		});

		it('Должен выбросить ошибку 422, если количество в корзине недостаточно', async () => {
			await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ productId: product.id, quantity: 1 });

			const res = await request(application.app)
				.post('/cart/checkout')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCheckoutData, items: [{ productId: product.id, quantity: 2 }], addressId });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.INSUFFICIENT_QUANTITY_IN_CART);
		});

		it('Должен выбросить ошибку 422, если количество на складе недостаточно', async () => {
			const lowStockProductData: ProductPayload = {
				name: 'Продукт с низким запасом',
				sku: `LOW-STOCK-${Date.now()}`,
				quantity: 5,
				price: 100,
				status: ProductStatus.AVAILABLE,
				cityId: cityId,
				categoryIds: [categoryId],
				createdById: managerId,
			};
			const lowStockProduct = await createTestProduct(
				application.app,
				adminToken,
				managerId,
				lowStockProductData,
			);
			expect(lowStockProduct.status).toBe(201);

			await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ productId: lowStockProduct.data.id, quantity: 5 });

			const res = await request(application.app)
				.post('/cart/checkout')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({
					...validCheckoutData,
					items: [{ productId: lowStockProduct.data.id, quantity: 10 }],
					addressId,
				});

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.INSUFFICIENT_QUANTITY_IN_CART);
		});

		it('Должен выбросить ошибку 422 для пустого списка товаров', async () => {
			const res = await request(application.app)
				.post('/cart/checkout')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCheckoutData, items: [], addressId });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.EMPTY_CART_NOT_ALLOWED);
		});

		it('Должен выбросить ошибку 404, если товар в корзине не найден', async () => {
			const res = await request(application.app)
				.post('/cart/checkout')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validCheckoutData, items: [{ productId: product.id, quantity: 2 }], addressId });

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.CART_ITEM_NOT_FOUND);
		});
	});

	describe('Удаление товара из корзины (DELETE /cart/:productId)', () => {
		it('Должен успешно удалить товар из корзины', async () => {
			await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ productId: product.id, quantity: 2 });

			const res = await request(application.app)
				.delete(`/cart/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.message).toBe(MESSAGES.CART_ITEM_DELETED);

			const cartRes = await request(application.app)
				.get('/cart')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(cartRes.body.data.items).toHaveLength(0);
		});

		it('Должен выбросить ошибку 404, если товар не найден в корзине', async () => {
			const res = await request(application.app)
				.delete(`/cart/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.CART_ITEM_NOT_FOUND);
		});

		it('Должен выбросить ошибку 401, если токен отсутствует', async () => {
			const res = await request(application.app).delete(`/cart/${product.id}`);

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
		});
	});
});
