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
let addressId: number;

beforeAll(async () => {
	const { app } = await boot;
	application = app;
	prisma = new PrismaClient();

	await cleanUp(prisma);

	const adminCredentials: UserCredentials = {
		email: 'superadmin@example.com',
		password: 'superadminPassword123',
	};
	const { token, status } = await loginUser(application.app, adminCredentials);
	expect(status).toBe(200);
	adminToken = token;

	const adminUser = await prisma.userModel.findUnique({
		where: { email: 'superadmin@example.com' },
	});
	if (!adminUser) {
		throw new Error('Admin user not found');
	}
	adminUserId = adminUser.id;
});

afterEach(async () => {
	await cleanUp(prisma);
});

afterAll(async () => {
	await prisma.$disconnect();
	await application.close();
});

describe('Тестирование продуктов (E2E)', () => {
	let managerId: number;
	let managerToken: string;

	beforeEach(async () => {
		await cleanUp(prisma);

		const result = await createTestWarehouseManager(application.app, adminToken);
		managerId = result.managerId;
		managerToken = result.managerToken;

		const city = await prisma.cityModel.create({
			data: {
				name: `Test City ${Date.now()}`,
			},
		});

		const address = await prisma.addressModel.create({
			data: {
				userId: adminUserId,
				address: 'Тестовая улица, 1',
				isDefault: true,
				cityId: city.id,
			},
		});
		addressId = address.id;

		const productA = await createTestProduct(application.app, adminToken, managerId, {
			name: 'Продукт А',
			sku: `PRODUCT-A-${Date.now()}`,
			quantity: 10,
			price: 100,
			status: ProductStatus.AVAILABLE,
		});
		const productB = await createTestProduct(application.app, adminToken, managerId, {
			name: 'Продукт Б',
			sku: `PRODUCT-B-${Date.now()}`,
			quantity: 20,
			price: 200,
			status: ProductStatus.AVAILABLE,
		});

		expect(productA.status).toBe(201);
		expect(productB.status).toBe(201);
	});

	describe('Создание продукта', () => {
		const validProductData: ProductPayload = {
			name: 'Ноутбук HP EliteBook',
			description: '15.6", Core i7, 16GB RAM',
			price: 1250.99,
			quantity: 10,
			sku: `NB-HP-ELITE-${Date.now()}`,
			status: ProductStatus.AVAILABLE,
		};

		it('Должен успешно создать продукт', async () => {
			const res = await request(application.app)
				.post('/products')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validProductData, createdById: managerId });

			expect(res.statusCode).toBe(201);
			expect(res.body.data).toMatchObject({
				name: 'Ноутбук HP EliteBook',
				status: ProductStatus.AVAILABLE,
			});
		});

		it('Должен выбросить ошибку 401, если токен отсутствует', async () => {
			const res = await request(application.app)
				.post('/products')
				.send({ ...validProductData, createdById: managerId });

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
		});

		it('Должен выбросить ошибку 401, если токен некорректен', async () => {
			const res = await request(application.app)
				.post('/products')
				.set('Authorization', 'Bearer malformed.token.here')
				.send({ ...validProductData, createdById: managerId });

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
		});

		it('Должен выбросить ошибку 422, если название отсутствует', async () => {
			const { name, ...invalidData } = validProductData;
			const res = await request(application.app)
				.post('/products')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...invalidData, createdById: managerId });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.NAME_REQUIRED_FIELD);
		});

		it('Должен выбросить ошибку 409, если SKU уже существует', async () => {
			await createTestProduct(application.app, adminToken, managerId, validProductData);
			const res = await request(application.app)
				.post('/products')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validProductData, createdById: managerId });

			expect(res.statusCode).toBe(409);
			expect(res.body.error).toBe(MESSAGES.PRODUCT_SKU_ALREADY_EXISTS);
		});
	});

	describe('Предложение продукта', () => {
		const validProposeData: Omit<ProductPayload, 'createdById'> = {
			name: 'Смартфон Samsung',
			description: '6.5", 8GB RAM',
			price: 799.99,
			quantity: 5,
			sku: `SM-SAMSUNG-${Date.now()}`,
			status: ProductStatus.OUT_OF_STOCK,
		};

		it('Должен успешно предложить продукт', async () => {
			const res = await request(application.app)
				.post('/products/propose')
				.set('Authorization', `Bearer ${managerToken}`)
				.send(validProposeData);

			expect(res.statusCode).toBe(201);
			expect(res.body.data).toMatchObject({
				name: 'Смартфон Samsung',
				status: ProductStatus.OUT_OF_STOCK,
			});
		});

		it('Должен выбросить ошибку 403, если роль пользователя не WAREHOUSE_MANAGER', async () => {
			const res = await request(application.app)
				.post('/products/propose')
				.set('Authorization', `Bearer ${adminToken}`)
				.send(validProposeData);

			expect(res.statusCode).toBe(403);
			expect(res.body.error).toBe(MESSAGES.FORBIDDEN_ACCESS);
		});

		it('Должен выбросить ошибку 409, если SKU уже существует', async () => {
			const firstProductRes = await request(application.app)
				.post('/products/propose')
				.set('Authorization', `Bearer ${managerToken}`)
				.send(validProposeData);
			expect(firstProductRes.statusCode).toBe(201);

			const res = await request(application.app)
				.post('/products/propose')
				.set('Authorization', `Bearer ${managerToken}`)
				.send(validProposeData);

			expect(res.statusCode).toBe(409);
			expect(res.body.error).toBe(MESSAGES.PRODUCT_SKU_ALREADY_EXISTS);
		});
	});

	describe('Получение всех продуктов', () => {
		it('Должен получить все продукты с фильтром по статусу', async () => {
			for (let i = 1; i <= 5; i++) {
				const result = await createTestProduct(application.app, adminToken, managerId, {
					name: `Тестовый Продукт ${i}`,
					sku: `TEST-PRODUCT-${i}-${Date.now()}`,
					quantity: 10,
					price: 100 * i,
					status: ProductStatus.AVAILABLE,
				});
				expect(result.status).toBe(201);
			}

			const res = await request(application.app)
				.get('/products?status=AVAILABLE')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toHaveLength(7);
			expect(res.body.data.items.every((p: any) => p.status === ProductStatus.AVAILABLE)).toBe(
				true,
			);
		});

		it('Должен получить все продукты без фильтра', async () => {
			const res = await request(application.app)
				.get('/products')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
		});

		it('Должен получить все продукты с сортировкой по названию (asc)', async () => {
			const res = await request(application.app)
				.get('/products')
				.set('Authorization', `Bearer ${adminToken}`)
				.query({ sortBy: 'name', sortOrder: 'asc' });

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toHaveLength(2);
			expect(res.body.data.items[0].name).toBe('Продукт А');
			expect(res.body.data.items[1].name).toBe('Продукт Б');
		});

		it('Должен получить все продукты с сортировкой по цене (desc)', async () => {
			const res = await request(application.app)
				.get('/products')
				.set('Authorization', `Bearer ${adminToken}`)
				.query({ sortBy: 'price', sortOrder: 'desc' });

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toHaveLength(2);
			expect(res.body.data.items[0].name).toBe('Продукт Б');
			expect(res.body.data.items[1].name).toBe('Продукт А');
		});

		it('Должен выбросить ошибку 422, если параметр сортировки некорректен', async () => {
			const res = await request(application.app)
				.get('/products')
				.set('Authorization', `Bearer ${adminToken}`)
				.query({ sortBy: 'invalidField', sortOrder: 'asc' });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.SORT_BY_INVALID_FORMAT);
		});

		it('Должен выбросить ошибку 401, если токен некорректен', async () => {
			const res = await request(application.app)
				.get('/products')
				.set('Authorization', 'Bearer invalid-token');

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
		});
	});

	describe('Получение моих продуктов', () => {
		it('Должен успешно получить продукты поставщика', async () => {
			await request(application.app)
				.post('/products/propose')
				.set('Authorization', `Bearer ${managerToken}`)
				.send({
					name: 'Мой Продукт',
					description: 'Мое Описание',
					price: 299.99,
					quantity: 5,
					sku: `MY-PRODUCT-${Date.now()}`,
					status: ProductStatus.OUT_OF_STOCK,
				});

			const res = await request(application.app)
				.get('/products/my')
				.set('Authorization', `Bearer ${managerToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toEqual(
				expect.arrayContaining([expect.objectContaining({ name: 'Мой Продукт' })]),
			);
		});

		it('Должен выбросить ошибку 403, если пользователь не WAREHOUSE_MANAGER', async () => {
			const res = await request(application.app)
				.get('/products/my')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(403);
			expect(res.body.error).toBe(MESSAGES.FORBIDDEN_ACCESS);
		});
	});

	describe('Обновление продукта', () => {
		it('Должен успешно обновить продукт', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Обновления',
				sku: `UPDATE-${Date.now()}`,
				quantity: 10,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});
			const res = await request(application.app)
				.patch(`/products/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({
					name: 'Обновленный Продукт',
					description: 'Обновленное Описание',
				});

			expect(res.statusCode).toBe(200);
			expect(res.body.data).toMatchObject({ name: 'Обновленный Продукт' });
		});

		it('Должен минимально обновить продукт', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Обновления',
				sku: `UPDATE-${Date.now()}`,
				quantity: 10,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});
			const res = await request(application.app)
				.patch(`/products/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ name: 'Минимально Обновленный' });

			expect(res.statusCode).toBe(200);
			expect(res.body.data).toMatchObject({ name: 'Минимально Обновленный' });
		});

		it('Должен выбросить ошибку 404, если ID продукта неверный', async () => {
			const res = await request(application.app)
				.patch('/products/9999')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ name: 'Некорректное Обновление' });

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
		});

		it('Должен выбросить ошибку 422, если обновление пустое', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Обновления',
				sku: `UPDATE-${Date.now()}`,
				quantity: 10,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});
			const res = await request(application.app)
				.patch(`/products/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({});

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.NON_EMPTY_OBJECT_VALIDATION_FAILED);
		});
	});

	describe('Покупка продукта', () => {
		it('Должен успешно выполнить покупку продукта', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Покупки',
				sku: `PURCHASE-${Date.now()}`,
				quantity: 10,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});

			const res = await request(application.app)
				.post(`/products/${product.id}/purchase`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ quantity: 2 });

			expect(res.statusCode).toBe(200);
			expect(res.body.data).toMatchObject({ quantity: 8 });
		});

		it('Должен выбросить ошибку 422, если количество недостаточно', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Покупки',
				sku: `PURCHASE-${Date.now()}`,
				quantity: 1,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});

			const res = await request(application.app)
				.post(`/products/${product.id}/purchase`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ quantity: 2 });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
		});

		it('Должен выбросить ошибку 422 при покупке с отрицательным количеством', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Покупки',
				sku: `PURCHASE-${Date.now()}`,
				quantity: 10,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});

			const res = await request(application.app)
				.post(`/products/${product.id}/purchase`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ quantity: -1 });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.QUANTITY_NOT_POSITIVE);
		});

		it('Должен выбросить ошибку 404, если продукт не существует', async () => {
			const res = await request(application.app)
				.post('/products/9999/purchase')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ quantity: 1 });

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
		});
	});

	describe('Удаление продукта', () => {
		it('Должен успешно удалить продукт', async () => {
			const productData = {
				name: 'Продукт для Удаления',
				sku: `DELETE-${Date.now()}`,
				quantity: 0,
				price: 100,
				status: ProductStatus.OUT_OF_STOCK,
			};
			const resCreate = await request(application.app)
				.post('/products/propose')
				.set('Authorization', `Bearer ${managerToken}`)
				.send(productData);
			expect(resCreate.statusCode).toBe(201);
			const product = resCreate.body.data;

			const res = await request(application.app)
				.delete(`/products/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.message).toBe(MESSAGES.PRODUCT_DELETED);
		});

		it('Должен выбросить ошибку 404, если ID продукта неверный', async () => {
			const res = await request(application.app)
				.delete('/products/9999')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
		});

		it('Должен выбросить ошибку 422, если продукт активен', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Активный Продукт',
				sku: `ACTIVE-${Date.now()}`,
				quantity: 10,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});
			const res = await request(application.app)
				.delete(`/products/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.CANNOT_DELETE_ACTIVE_PRODUCT);
		});

		it('Должен выбросить ошибку 403, если роль пользователя — WAREHOUSE_MANAGER', async () => {
			const productData = {
				name: 'Продукт для Удаления',
				sku: `DELETE-${Date.now()}`,
				quantity: 0,
				price: 100,
				status: ProductStatus.OUT_OF_STOCK,
			};
			const resCreate = await request(application.app)
				.post('/products/propose')
				.set('Authorization', `Bearer ${managerToken}`)
				.send(productData);
			expect(resCreate.statusCode).toBe(201);
			const product = resCreate.body.data;

			const res = await request(application.app)
				.delete(`/products/${product.id}`)
				.set('Authorization', `Bearer ${managerToken}`);

			expect(res.statusCode).toBe(403);
			expect(res.body.error).toBe(MESSAGES.FORBIDDEN_ACCESS);
		});
	});

	describe('Интеграция с корзиной', () => {
		it('Должен успешно добавить продукт в корзину и оформить заказ', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Корзины',
				sku: `CART-${Date.now()}`,
				quantity: 10,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});

			const addToCartRes = await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ productId: product.id, quantity: 2 });

			expect(addToCartRes.statusCode).toBe(201);
			expect(addToCartRes.body.message).toBe(MESSAGES.CART_ITEM_ADDED);
			expect(addToCartRes.body.data).toMatchObject({
				productId: product.id,
				quantity: 2,
				price: 100,
			});

			const getCartRes = await request(application.app)
				.get('/cart')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(getCartRes.statusCode).toBe(200);
			expect(getCartRes.body.message).toBe(MESSAGES.CART_RETRIEVED);
			expect(getCartRes.body.data.items).toHaveLength(1);
			expect(getCartRes.body.data.total).toBe(200);

			const addressCheck = await prisma.addressModel.findUnique({
				where: { id: addressId },
			});
			const cartCheck = await prisma.cartModel.findMany({
				where: { userId: adminUserId },
			});

			const checkoutRes = await request(application.app)
				.post('/cart/checkout')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ items: [{ productId: product.id, quantity: 2 }], addressId });

			expect(checkoutRes.statusCode).toBe(200);
			expect(checkoutRes.body.message).toBe(MESSAGES.CHECKOUT_COMPLETED);
			expect(checkoutRes.body.data.items).toHaveLength(1);

			const productAfterCheckout = await request(application.app)
				.get(`/products/${product.id}`)
				.set('Authorization', `Bearer ${adminToken}`);

			expect(productAfterCheckout.statusCode).toBe(200);
			expect(productAfterCheckout.body.data.quantity).toBe(8);
		});

		it('Должен выбросить ошибку 422 при оформлении заказа с недостаточным количеством в корзине', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Корзины',
				sku: `CART-${Date.now()}`,
				quantity: 1,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});

			const addToCartRes = await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ productId: product.id, quantity: 1 });

			expect(addToCartRes.statusCode).toBe(201);

			const res = await request(application.app)
				.post('/cart/checkout')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ items: [{ productId: product.id, quantity: 2 }], addressId });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.INSUFFICIENT_QUANTITY_IN_CART);
		});

		it('Должен выбросить ошибку 422 при попытке добавить в корзину больше, чем есть на складе', async () => {
			const { data: product } = await createTestProduct(application.app, adminToken, managerId, {
				name: 'Продукт для Корзины',
				sku: `CART-${Date.now()}`,
				quantity: 1,
				price: 100,
				status: ProductStatus.AVAILABLE,
			});

			const addToCartRes = await request(application.app)
				.post('/cart')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ productId: product.id, quantity: 2 });

			expect(addToCartRes.statusCode).toBe(422);
			expect(addToCartRes.body.error).toBe(MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
		});

		it('Должен выбросить ошибку 404 при удалении несуществующего товара из корзины', async () => {
			const res = await request(application.app)
				.delete('/cart/9999')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.CART_ITEM_NOT_FOUND);
		});
	});
});
