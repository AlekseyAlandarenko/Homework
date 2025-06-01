import { App } from '../src/app';
import { boot } from '../src/main';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import {
  cleanUp,
  loginUser,
  createTestWarehouseManager,
  createTestProduct,
  UserCredentials,
  ProductPayload,
} from './testUtils';
import { MESSAGES } from '../src/common/messages';

let application: App;
let prisma: PrismaClient;
let adminToken: string;

beforeAll(async () => {
  const { app } = await boot;
  application = app;
  prisma = new PrismaClient();

  await cleanUp(prisma);

  const adminCredentials: UserCredentials = {
    email: 'superadmin@example.com',
    password: 'superadmin_password',
  };
  const { token, status } = await loginUser(application.app, adminCredentials);
  expect(status).toBe(200);
  adminToken = token;
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
  });

  describe('Создание продукта', () => {
    const validProductData: ProductPayload = {
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      quantity: 10,
      category: 'Test Category',
      sku: `SKU-${Date.now()}`,
      isActive: true,
    };

    it('Должен успешно создать продукт', async () => {
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData);
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toMatchObject({
        name: 'Test Product',
        isActive: true,
      });
      expect(res.body.message).toBe(MESSAGES.PRODUCT_CREATED);
    });

    it('Должен выбросить ошибку 403, если роль пользователя — начальник склада', async () => {
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validProductData);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });

    it('Должен выбросить ошибку 401, если токен отсутствует', async () => {
      const res = await request(application.app)
        .post('/products')
        .send(validProductData);
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
    });

    it('Должен выбросить ошибку 401, если токен некорректен', async () => {
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', 'Bearer malformed.token.here')
        .send(validProductData);
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
    });

    it('Должен выбросить ошибку 422, если название отсутствует', async () => {
      const { name, ...invalidData } = validProductData;
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_NAME);
    });

    it('Должен выбросить ошибку 422, если цена отрицательная', async () => {
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProductData, price: -10 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PRICE_NEGATIVE);
    });

    it('Должен выбросить ошибку 422, если артикул уже существует', async () => {
      await createTestProduct(application.app, adminToken, managerId, validProductData);
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProductData, sku: validProductData.sku });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.SKU_ALREADY_EXISTS);
    });
  });

  describe('Добавление количества продукта', () => {
    let productId: number;

    beforeEach(async () => {
      const { data } = await createTestProduct(application.app, adminToken, managerId);
      productId = data.id;
    });

    it('Должен успешно добавить количество товара', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}/quantity`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 5 });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.quantity).toBe(15);
      expect(res.body.message).toBe(MESSAGES.PRODUCT_QUANTITY_UPDATED);
    });

    it('Должен выбросить ошибку 422, если количество равно нулю', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}/quantity`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 0 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.QUANTITY_NEGATIVE);
    });

    it('Должен выбросить ошибку 404, если продукт не существует', async () => {
      const res = await request(application.app)
        .patch('/products/9999/quantity')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 5 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен выбросить ошибку 422, если ID некорректен', async () => {
      const res = await request(application.app)
        .patch('/products/0/quantity')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 5 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_ID);
    });
  });

  describe('Получение всех продуктов', () => {
    beforeEach(async () => {
      await cleanUp(prisma);
      await createTestProduct(application.app, adminToken, managerId, {
        name: 'Product B',
        price: 200,
        category: 'General',
      });
      await createTestProduct(application.app, adminToken, managerId, {
        name: 'Product A',
        price: 100,
        category: 'General',
        quantity: 0,
      });
    });

    it('Должен успешно получить все продукты для роли начальника склада', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({ sortBy: 'name', sortOrder: 'desc' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toMatchObject({ name: 'Product B' });
      expect(res.body.data[1]).toMatchObject({ name: 'Product A' });
    });

    it('Должен получить все продукты с фильтром по категории', async () => {
      for (let i = 1; i <= 5; i++) {
        const result = await createTestProduct(application.app, adminToken, managerId, {
          name: `Test Product ${i}`,
          category: 'Test Category',
        });
        expect(result.status).toBe(201);
      }

      const res = await request(application.app)
        .get('/products?category=Test Category')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(5);
      expect(res.body.data.every((p: any) => p.category === 'Test Category')).toBe(true);
    });

    it('Должен получить все продукты без фильтра', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('Должен получить все продукты с сортировкой по имени (asc)', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'name', sortOrder: 'asc' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('Product A');
      expect(res.body.data[1].name).toBe('Product B');
    });

    it('Должен получить все продукты с сортировкой по цене (desc)', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'price', sortOrder: 'desc' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('Product B');
      expect(res.body.data[1].name).toBe('Product A');
    });

    it('Должен выбросить ошибку 422, если параметр сортировки некорректен', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'invalidField', sortOrder: 'asc' });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_SORT_PARAM);
    });

    it('Должен выбросить ошибку 401, если токен некорректен', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
    });
  });

  describe('Получение остатков товаров', () => {
    let productId: number;

    beforeEach(async () => {
      const { data } = await createTestProduct(application.app, adminToken, managerId);
      productId = data.id;
    });

    it('Должен успешно получить остатки товаров', async () => {
      const res = await request(application.app)
        .get('/products/stock')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({ id: productId, quantity: 10 });
    });

    it('Должен выбросить ошибку 401, если токен отсутствует', async () => {
      const res = await request(application.app)
        .get('/products/stock');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
    });
  });

  describe('Обновление продукта', () => {
    let productId: number;

    beforeEach(async () => {
      const { data } = await createTestProduct(application.app, adminToken, managerId);
      productId = data.id;
    });

    it('Должен успешно обновить продукт', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          description: 'Updated Description',
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatchObject({ name: 'Updated Product' });
      expect(res.body.message).toBe(MESSAGES.PRODUCT_UPDATED);
    });

    it('Должен минимально обновить продукт', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Minimally Updated' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatchObject({ name: 'Minimally Updated' });
      expect(res.body.message).toBe(MESSAGES.PRODUCT_UPDATED);
    });

    it('Должен выбросить ошибку 404, если ID продукта неверный', async () => {
      const res = await request(application.app)
        .patch('/products/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Invalid Update' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен выбросить ошибку 422, если цена отрицательная', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: -10 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PRICE_NEGATIVE);
    });

    it('Должен выбросить ошибку 422, если обновление пустое', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.VALIDATION_FAILED);
    });
  });

  describe('Покупка продукта', () => {
    let productId: number;

    beforeEach(async () => {
      const { data } = await createTestProduct(application.app, adminToken, managerId);
      productId = data.id;
    });

    it('Должен успешно выполнить покупку продукта', async () => {
      const res = await request(application.app)
        .post(`/products/${productId}/purchase`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.quantity).toBe(5);
      expect(res.body.message).toBe(MESSAGES.PRODUCT_PURCHASE_COMPLETED);
    });

    it('Должен выбросить ошибку 422, если количество равно нулю', async () => {
      const res = await request(application.app)
        .post(`/products/${productId}/purchase`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 0 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.QUANTITY_NEGATIVE);
    });

    it('Должен выбросить ошибку 404, если продукт не существует', async () => {
      const res = await request(application.app)
        .post('/products/9999/purchase')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен выбросить ошибку 422, если количества недостаточно', async () => {
      const res = await request(application.app)
        .post(`/products/${productId}/purchase`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 15 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
    });
  });

  describe('Удаление продукта', () => {
    let productId: number;

    beforeEach(async () => {
      const { data } = await createTestProduct(application.app, adminToken, managerId);
      productId = data.id;
    });

    it('Должен успешно удалить продукт', async () => {
      const res = await request(application.app)
        .delete(`/products/${productId}`)
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

    it('Должен выбросить ошибку 403, если роль пользователя — начальник склада', async () => {
      const res = await request(application.app)
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });
  });
});