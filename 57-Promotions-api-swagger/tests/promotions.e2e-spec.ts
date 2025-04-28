import { App } from '../src/app';
import { boot } from '../src/main';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import {
  cleanUp,
  createTestSupplier,
  createTestPromotion,
  loginUser,
  PromotionPayload,
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

describe('Тестирование промоакций (E2E)', () => {
  let supplierId: number;
  let supplierToken: string;

  beforeEach(async () => {
    const result = await createTestSupplier(application.app, adminToken);
    supplierId = result.supplierId;
    supplierToken = result.supplierToken;
  });

  describe('Создание промоакции', () => {
    const validPromotionData: PromotionPayload = {
      title: 'Admin Promotion',
      description: 'Admin Created Promotion',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      supplierId: 0,
    };

    it('Должен успешно создать промоакцию', async () => {
      const res = await request(application.app)
        .post('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPromotionData, supplierId });
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toMatchObject({
        title: 'Admin Promotion',
        status: 'APPROVED',
      });
    });

    it('Должен завершиться ошибкой при неверном поставщике', async () => {
      const res = await request(application.app)
        .post('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPromotionData, supplierId: 9999 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.USER_NOT_FOUND);
    });

    it('Должен завершиться ошибкой без токена', async () => {
      const res = await request(application.app)
        .post('/promotions')
        .send({ ...validPromotionData, supplierId });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
    });

    it('Должен завершиться ошибкой с некорректным токеном', async () => {
      const res = await request(application.app)
        .post('/promotions')
        .set('Authorization', 'Bearer malformed.token.here')
        .send({ ...validPromotionData, supplierId });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
    });

    it('Должен завершиться ошибкой без названия', async () => {
      const { title, ...invalidData } = validPromotionData;
      const res = await request(application.app)
        .post('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...invalidData, supplierId });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Название'));
    });

    it('Должен завершиться ошибкой, если дата окончания раньше даты начала', async () => {
      const res = await request(application.app)
        .post('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validPromotionData,
          supplierId,
          startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_DATES);
    });
  });

  describe('Предложение промоакции', () => {
    const validProposeData: Omit<PromotionPayload, 'supplierId'> = {
      title: 'Supplier Promotion',
      description: 'Supplier Proposed Promotion',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    };

    it('Должен успешно предложить промоакцию', async () => {
      const res = await request(application.app)
        .post('/promotions/propose')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send(validProposeData);
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toMatchObject({
        title: 'Supplier Promotion',
        status: 'PENDING',
      });
    });

    it('Должен завершиться ошибкой при дате начала в прошлом', async () => {
      const res = await request(application.app)
        .post('/promotions/propose')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          ...validProposeData,
          startDate: new Date(Date.now() - 86400000).toISOString(),
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PAST_START_DATE);
    });

    it('Должен завершиться ошибкой, если дата окончания раньше даты начала', async () => {
      const res = await request(application.app)
        .post('/promotions/propose')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          ...validProposeData,
          startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_DATES);
    });
  });

  describe('Получение всех промоакций', () => {
    let supplierId: number;
    let supplierToken: string;

    beforeEach(async () => {
      await cleanUp(prisma);

      const result = await createTestSupplier(application.app, adminToken);
      supplierId = result.supplierId;
      supplierToken = result.supplierToken;

      const promoB = await createTestPromotion(application.app, adminToken, supplierId, {
        title: 'Promo B',
        startDate: new Date(Date.now() + 86400000).toISOString(),
      });
      const promoA = await createTestPromotion(application.app, adminToken, supplierId, {
        title: 'Promo A',
        startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      });

      expect(promoB.status).toBe(201);
      expect(promoA.status).toBe(201);
    });

    it('Должен получить все промоакции с фильтром по статусу', async () => {
      for (let i = 1; i <= 5; i++) {
        const result = await createTestPromotion(application.app, adminToken, supplierId, {
          title: `Test Promotion ${i}`,
        });
        expect(result.status).toBe(201);
      }

      const res = await request(application.app)
        .get('/promotions?status=APPROVED')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(7);
      expect(res.body.data.every((p: any) => p.status === 'APPROVED')).toBe(true);
    });

    it('Должен получить все промоакции без фильтра', async () => {
      const res = await request(application.app)
        .get('/promotions')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('Должен получить все промоакции с сортировкой по названию (asc)', async () => {
      const res = await request(application.app)
        .get('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'title', sortOrder: 'asc' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe('Promo A');
      expect(res.body.data[1].title).toBe('Promo B');
    });

    it('Должен получить все промоакции с сортировкой по дате начала (desc)', async () => {
      const res = await request(application.app)
        .get('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'startDate', sortOrder: 'desc' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe('Promo A');
      expect(res.body.data[1].title).toBe('Promo B');
    });

    it('Должен завершиться ошибкой с некорректным параметром сортировки', async () => {
      const res = await request(application.app)
        .get('/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'invalidField', sortOrder: 'asc' });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_SORT_PARAM);
    });

    it('Должен завершиться ошибкой с некорректным токеном', async () => {
      const res = await request(application.app)
        .get('/promotions')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
    });

    it('Должен завершиться ошибкой для роли поставщика', async () => {
      const res = await request(application.app)
        .get('/promotions')
        .set('Authorization', `Bearer ${supplierToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });
  });

  describe('Получение моих промоакций', () => {
    it('Должен успешно получить промоакции поставщика', async () => {
      await request(application.app)
        .post('/promotions/propose')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          title: 'My Promotion',
          description: 'My Description',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        });

      const res = await request(application.app)
        .get('/promotions/my')
        .set('Authorization', `Bearer ${supplierToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ title: 'My Promotion' })])
      );
    });

    it('Должен завершиться ошибкой для не-поставщика', async () => {
      const res = await request(application.app)
        .get('/promotions/my')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });
  });

  describe('Обновление промоакции', () => {
    it('Должен успешно обновить промоакцию', async () => {
      const { data: promotion } = await createTestPromotion(
        application.app,
        adminToken,
        supplierId
      );
      const res = await request(application.app)
        .patch(`/promotions/${promotion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Promotion',
          description: 'Updated Description',
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatchObject({ title: 'Updated Promotion' });
    });

    it('Должен минимально обновить промоакцию', async () => {
      const { data: promotion } = await createTestPromotion(
        application.app,
        adminToken,
        supplierId
      );
      const res = await request(application.app)
        .patch(`/promotions/${promotion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Minimally Updated' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatchObject({ title: 'Minimally Updated' });
    });

    it('Должен завершиться ошибкой с неверным ID', async () => {
      const res = await request(application.app)
        .patch('/promotions/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Invalid Update' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PROMOTION_NOT_FOUND);
    });

    it('Должен завершиться ошибкой с некорректными датами', async () => {
      const { data: promotion } = await createTestPromotion(
        application.app,
        adminToken,
        supplierId
      );
      const res = await request(application.app)
        .patch(`/promotions/${promotion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_DATES);
    });

    it('Должен завершиться ошибкой с пустым обновлением', async () => {
      const { data: promotion } = await createTestPromotion(
        application.app,
        adminToken,
        supplierId
      );
      const res = await request(application.app)
        .patch(`/promotions/${promotion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.VALIDATION_FAILED);
    });
  });

  describe('Обновление статуса промоакции', () => {
    it('Должен успешно обновить статус промоакции', async () => {
      const proposeRes = await request(application.app)
        .post('/promotions/propose')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          title: 'Status Promotion',
          description: 'To be approved',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        });
      expect(proposeRes.statusCode).toBe(201);
      const promotionId = proposeRes.body.data.id;

      const res = await request(application.app)
        .patch(`/promotions/${promotionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatchObject({ status: 'APPROVED' });
    });

    it('Должен завершиться ошибкой с некорректным статусом', async () => {
      const proposeRes = await request(application.app)
        .post('/promotions/propose')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          title: 'Invalid Status Promotion',
          description: 'Invalid Status',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        });
      expect(proposeRes.statusCode).toBe(201);
      const promotionId = proposeRes.body.data.id;

      const res = await request(application.app)
        .patch(`/promotions/${promotionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID' });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_STATUS);
    });

    it('Должен завершиться ошибкой для несуществующей промоакции', async () => {
      const res = await request(application.app)
        .patch('/promotions/9999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PROMOTION_NOT_FOUND);
    });
  });

  describe('Публикация утвержденных промоакций', () => {
    it('Должен отобразить утвержденную акцию поставщика в общем списке', async () => {
      const proposeRes = await request(application.app)
        .post('/promotions/propose')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          title: 'Supplier Approved Promo',
          description: 'Supplier Description',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        });
      expect(proposeRes.statusCode).toBe(201);
      const promotionId = proposeRes.body.data.id;

      await request(application.app)
        .patch(`/promotions/${promotionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' })
        .expect(200);

      const res = await request(application.app)
        .get('/promotions')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: promotionId,
            title: 'Supplier Approved Promo',
            status: 'APPROVED',
          }),
        ])
      );
    });

    it('Должен отобразить акцию, созданную администратором, в общем списке', async () => {
      const createRes = await createTestPromotion(application.app, adminToken, supplierId, {
        title: 'Admin Approved Promo',
      });
      expect(createRes.status).toBe(201);
      const promotionId = createRes.data.id;

      const res = await request(application.app)
        .get('/promotions')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: promotionId,
            title: 'Admin Approved Promo',
            status: 'APPROVED',
          }),
        ])
      );
    });
  });

  describe('Удаление промоакции', () => {
    it('Должен успешно удалить промоакцию', async () => {
      const { data: promotion } = await createTestPromotion(
        application.app,
        adminToken,
        supplierId
      );
      const res = await request(application.app)
        .delete(`/promotions/${promotion.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(MESSAGES.PROMOTION_DELETED);
    });

    it('Должен завершиться ошибкой с неверным ID', async () => {
      const res = await request(application.app)
        .delete('/promotions/9999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.PROMOTION_NOT_FOUND);
    });

    it('Должен завершиться ошибкой для роли поставщика', async () => {
      const { data: promotion } = await createTestPromotion(
        application.app,
        adminToken,
        supplierId
      );
      const res = await request(application.app)
        .delete(`/promotions/${promotion.id}`)
        .set('Authorization', `Bearer ${supplierToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });
  });
});