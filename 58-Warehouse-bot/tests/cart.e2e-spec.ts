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

describe('Тестирование корзины (E2E)', () => {
  let managerId: number;
  let managerToken: string;
  let productId: number;
  let secondProductId: number;

  beforeEach(async () => {
    await cleanUp(prisma);
    const result = await createTestWarehouseManager(application.app, adminToken);
    managerId = result.managerId;
    managerToken = result.managerToken;

    const { data: firstProduct } = await createTestProduct(application.app, adminToken, managerId);
    productId = firstProduct.id;

    const { data: secondProduct } = await createTestProduct(application.app, adminToken, managerId, {
      name: 'Second Test Product',
      sku: `SKU-${Date.now()}-2`,
    });
    secondProductId = secondProduct.id;
  });

  describe('Операции с корзиной', () => {
    it('Должен успешно добавить товар в корзину', async () => {
      const res = await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId, quantity: 2 });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(MESSAGES.CART_ITEM_ADDED);
    });

    it('Должен успешно получить содержимое корзины', async () => {
      await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId, quantity: 2 });
      const res = await request(application.app)
        .get('/cart')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]).toMatchObject({ productId, quantity: 2 });
    });

    it('Должен успешно получить пустую корзину', async () => {
      const res = await request(application.app)
        .get('/cart')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });

    it('Должен успешно получить корзину с несколькими товарами', async () => {
      await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId, quantity: 2 });
      await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId: secondProductId, quantity: 3 });
      const res = await request(application.app)
        .get('/cart')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ productId, quantity: 2 }),
          expect.objectContaining({ productId: secondProductId, quantity: 3 }),
        ]),
      );
      expect(res.body.data.total).toBeGreaterThan(0);
    });

    it('Должен выбросить ошибку 401, если токен некорректен', async () => {
      const res = await request(application.app)
        .get('/cart')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
    });

    it('Должен успешно оформить заказ', async () => {
      await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId, quantity: 2 });
      const res = await request(application.app)
        .post('/cart/checkout')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ items: [{ productId, quantity: 2 }] });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(MESSAGES.CHECKOUT_COMPLETED);
    });

    it('Должен успешно удалить товар из корзины', async () => {
      await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId, quantity: 2 });
      const res = await request(application.app)
        .delete(`/cart/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(MESSAGES.CART_ITEM_REMOVED);
    });

    it('Должен выбросить ошибку 404, если продукт не существует', async () => {
      const res = await request(application.app)
        .delete(`/cart/9999`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен выбросить ошибку 404, если товар отсутствует в корзине', async () => {
      await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId, quantity: 2 });
      await request(application.app)
        .delete(`/cart/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      const res = await request(application.app)
        .delete(`/cart/${productId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.CART_ITEM_NOT_FOUND);
    });

    it('Должен выбросить ошибку 422, если ID некорректен', async () => {
      const res = await request(application.app)
        .delete(`/cart/0`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toContain(MESSAGES.INVALID_ID);
    });

    it('Должен выбросить ошибку 401, если токен отсутствует при удалении', async () => {
      const res = await request(application.app)
        .delete(`/cart/${productId}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
    });

    it('Должен выбросить ошибку 422, если количество равно нулю', async () => {
      const res = await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId, quantity: 0 });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.QUANTITY_NEGATIVE);
    });

    it('Должен выбросить ошибку 404, если продукт не существует при добавлении', async () => {
      const res = await request(application.app)
        .post('/cart')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ productId: 9999, quantity: 2 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен выбросить ошибку 404, если продукт не существует при оформлении заказа', async () => {
      const res = await request(application.app)
        .post('/cart/checkout')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ items: [{ productId: 9999, quantity: 2 }] });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PRODUCT_NOT_FOUND);
    });

    it('Должен выбросить ошибку 401, если токен отсутствует при добавлении', async () => {
      const res = await request(application.app)
        .post('/cart')
        .send({ productId, quantity: 2 });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
    });

    it('Должен выбросить ошибку 401, если токен отсутствует при получении корзины', async () => {
      const res = await request(application.app)
        .get('/cart');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
    });

    it('Должен выбросить ошибку 401, если токен отсутствует при оформлении заказа', async () => {
      const res = await request(application.app)
        .post('/cart/checkout')
        .send({ items: [{ productId, quantity: 2 }] });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
    });
  });
});