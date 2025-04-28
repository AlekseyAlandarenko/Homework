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

    it('Должен завершиться ошибкой для несуществующего пользователя', async () => {
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validProductData);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });

    it('Должен завершиться ошибкой без токена', async () => {
      const res = await request(application.app)
        .post('/products')
        .send(validProductData);
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
    });

    it('Должен завершиться ошибкой с некорректным токеном', async () => {
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', 'Bearer malformed.token.here')
        .send(validProductData);
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
    });

    it('Должен завершиться ошибкой без названия', async () => {
      const { name, ...invalidData } = validProductData;
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Название'));
    });

    it('Должен завершиться ошибкой с отрицательной ценой', async () => {
      const res = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProductData, price: -10 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PRICE_NEGATIVE);
    });
  });

  describe('Добавление количества продукта', () => {
    let productId: number;

    beforeEach(async () => {
      const { data } = await createTestProduct(application.app, adminToken, managerId);
      productId = data.id;
    });

    it('Должен успешно добавить количество продукта', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}/quantity`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 5 });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.quantity).toBe(15);
      expect(res.body.message).toBe(MESSAGES.PRODUCT_QUANTITY_UPDATED);
    });

    it('Должен завершиться ошибкой с нулевым количеством', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}/quantity`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 0 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.QUANTITY_ZERO_OR_NEGATIVE);
    });

    it('Должен завершиться ошибкой для несуществующего продукта', async () => {
      const res = await request(application.app)
        .patch('/products/9999/quantity')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ quantity: 5 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
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
      });
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

    it('Должен завершиться ошибкой с некорректным параметром сортировки', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'invalidField', sortOrder: 'asc' });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_SORT_PARAM);
    });

    it('Должен завершиться ошибкой с некорректным токеном', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
    });

    it('Должен завершиться ошибкой для роли менеджера склада', async () => {
      const res = await request(application.app)
        .get('/products')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });
  });

  describe('Получение продуктов менеджера', () => {
    it('Должен успешно получить все продукты для менеджера через /products/all', async () => {
      const productData: ProductPayload = {
        name: 'Manager Product',
        description: 'Manager Description',
        price: 100,
        quantity: 10,
        category: 'Test Category',
        sku: `SKU-${Date.now()}`,
        isActive: true,
      };
      const resCreate = await request(application.app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);
      expect(resCreate.statusCode).toBe(201);
  
      const res = await request(application.app)
        .get('/products/all')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Manager Product' })])
      );
    });
  
    it('Должен завершиться ошибкой для не-менеджера', async () => {
      const res = await request(application.app)
        .get('/products/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
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
    });

    it('Должен завершиться ошибкой с неверным ID', async () => {
      const res = await request(application.app)
        .patch('/products/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Invalid Update' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен завершиться ошибкой с отрицательной ценой', async () => {
      const res = await request(application.app)
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: -10 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PRICE_NEGATIVE);
    });

    it('Должен завершиться ошибкой с пустым обновлением', async () => {
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

    it('Должен завершиться ошибкой с нулевым количеством', async () => {
      const res = await request(application.app)
        .post(`/products/${productId}/purchase`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 0 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.QUANTITY_ZERO_OR_NEGATIVE);
    });

    it('Должен завершиться ошибкой для несуществующего продукта', async () => {
      const res = await request(application.app)
        .post('/products/9999/purchase')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен завершиться ошибкой при недостаточном количестве', async () => {
      const res = await request(application.app)
        .post(`/products/${productId}/purchase`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 15 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
    });
  });

  describe('Получение статуса продукта', () => {
    let productId: number;

    beforeEach(async () => {
      const { data } = await createTestProduct(application.app, adminToken, managerId);
      productId = data.id;
    });

    it('Должен успешно получить статус продукта', async () => {
      const res = await request(application.app).get(`/products/${productId}/status`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatchObject({
        id: productId,
        name: 'Test Product',
        quantity: 10,
        isActive: true,
      });
    });

    it('Должен вернуть сообщение о нулевом количестве', async () => {
      const { data } = await createTestProduct(application.app, adminToken, managerId, {
        quantity: 0,
      });
      const res = await request(application.app).get(`/products/${data.id}/status`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatchObject({
        quantity: 0,
        message: MESSAGES.PRODUCT_OUT_OF_STOCK,
      });
    });

    it('Должен завершиться ошибкой для несуществующего продукта', async () => {
      const res = await request(application.app).get('/products/9999/status');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
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

    it('Должен завершиться ошибкой с неверным ID', async () => {
      const res = await request(application.app)
        .delete('/products/9999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен завершиться ошибкой для роли менеджера склада', async () => {
      const res = await request(application.app)
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });
  });
});