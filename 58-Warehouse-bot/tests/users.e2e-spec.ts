import { App } from '../src/app';
import { boot } from '../src/main';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import {
  cleanUp,
  createTestWarehouseManager,
  loginUser,
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

describe('Тестирование пользователей (E2E)', () => {
  describe('Регистрация администратора', () => {
    it('Должен успешно зарегистрировать администратора', async () => {
      const adminData: UserCredentials = {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Test Admin',
      };

      const res = await request(application.app)
        .post('/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adminData);
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toMatchObject({
        email: 'admin@test.com',
        role: 'ADMIN',
      });
    });

    it('Должен выбросить ошибку 422, если email некорректен', async () => {
      const res = await request(application.app)
        .post('/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Invalid Admin',
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.INVALID_EMAIL);
    });

    it('Должен выбросить ошибку 422, если пользователь уже существует', async () => {
      await request(application.app)
        .post('/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin@test.com',
          password: 'password123',
          name: 'Test Admin',
        });

      const res = await request(application.app)
        .post('/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin@test.com',
          password: 'password123',
          name: 'Test Admin',
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.USER_ALREADY_EXISTS);
    });

    it('Должен выбросить ошибку 422, если пароль слабый', async () => {
      const res = await request(application.app)
        .post('/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'weakadmin@test.com',
          password: 'weak',
          name: 'Weak Admin',
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PASSWORD_COMPLEXITY);
    });

    it('Должен выбросить ошибку 403, если пользователь не суперадминистратор', async () => {
      await request(application.app)
        .post('/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'otheradmin@test.com',
          password: 'password123',
          name: 'Other Admin',
        });

      const { token: otherAdminToken } = await loginUser(application.app, {
        email: 'otheradmin@test.com',
        password: 'password123',
      });

      const res = await request(application.app)
        .post('/users/admin')
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .send({
          email: 'newadmin@test.com',
          password: 'password123',
          name: 'New Admin',
        });
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe(MESSAGES.FORBIDDEN);
    });
  });

  describe('Регистрация начальника склада', () => {
    it('Должен успешно зарегистрировать начальника склада', async () => {
      const { managerId } = await createTestWarehouseManager(application.app, adminToken);
      const res = await request(application.app)
        .get('/users/warehouseManagers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: managerId,
            email: 'manager@test.com',
            role: 'WAREHOUSE_MANAGER',
          }),
        ])
      );
    });

    it('Должен выбросить ошибку 422, если начальник склада уже существует', async () => {
      await createTestWarehouseManager(application.app, adminToken);
      const res = await request(application.app)
        .post('/users/warehouseManager')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'manager@test.com',
          password: 'password123',
          name: 'Test Manager',
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.USER_ALREADY_EXISTS);
    });

    it('Должен выбросить ошибку 422, если имя отсутствует', async () => {
      const res = await request(application.app)
        .post('/users/warehouseManager')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'noname@test.com',
          password: 'password123',
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Имя'));
    });
  });

  describe('Авторизация', () => {
    it('Должен успешно войти в систему', async () => {
      await createTestWarehouseManager(application.app, adminToken);
      const { status, token } = await loginUser(application.app, {
        email: 'manager@test.com',
        password: 'password123',
      });
      expect(status).toBe(200);
      expect(token).toBeDefined();
    });

    it('Должен выбросить ошибку 401, если учетные данные неверны', async () => {
      const { status, error } = await loginUser(application.app, {
        email: 'manager@test.com',
        password: 'wrongpassword',
      });
      expect(status).toBe(401);
      expect(error).toBe(MESSAGES.INVALID_CREDENTIALS);
    });

    it('Должен выбросить ошибку 401, если пользователь не существует', async () => {
      const { status, error } = await loginUser(application.app, {
        email: 'nonexistent@test.com',
        password: 'password123',
      });
      expect(status).toBe(401);
      expect(error).toBe(MESSAGES.INVALID_CREDENTIALS);
    });
  });

  describe('Обновление пароля начальника склада', () => {
    it('Должен успешно обновить пароль', async () => {
      const { managerId } = await createTestWarehouseManager(application.app, adminToken);
      const res = await request(application.app)
        .patch(`/users/warehouseManager/${managerId}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'newpassword123' });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(MESSAGES.PASSWORD_UPDATED);

      const { status } = await loginUser(application.app, {
        email: 'manager@test.com',
        password: 'newpassword123',
      });
      expect(status).toBe(200);
    });

    it('Должен выбросить ошибку 404, если ID неверный', async () => {
      const res = await request(application.app)
        .patch('/users/warehouseManager/9999/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'newpassword123' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.USER_NOT_FOUND);
    });

    it('Должен выбросить ошибку 422, если пароль слабый', async () => {
      const { managerId } = await createTestWarehouseManager(application.app, adminToken);
      const res = await request(application.app)
        .patch(`/users/warehouseManager/${managerId}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'weak' });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.PASSWORD_COMPLEXITY);
    });

    it('Должен выбросить ошибку 422, если пароль пустой', async () => {
      const { managerId } = await createTestWarehouseManager(application.app, adminToken);
      const res = await request(application.app)
        .patch(`/users/warehouseManager/${managerId}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: '' });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toBe(MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Новый пароль'));
    });
  });

  describe('Удаление начальника склада', () => {
    it('Должен успешно удалить начальника склада', async () => {
      const { managerId } = await createTestWarehouseManager(application.app, adminToken);
      const res = await request(application.app)
        .delete(`/users/warehouseManager/${managerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(MESSAGES.USER_DELETED);
    });

    it('Должен выбросить ошибку 404, если ID неверный', async () => {
      const res = await request(application.app)
        .delete('/users/warehouseManager/9999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe(MESSAGES.USER_NOT_FOUND);
    });
  });

  describe('Получение списка начальников склада', () => {
    it('Должен успешно получить список начальников склада', async () => {
      await createTestWarehouseManager(application.app, adminToken);
      const res = await request(application.app)
        .get('/users/warehouseManagers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});