import { App } from '../src/app';
import { boot } from '../src/main';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { cleanUp, createTestWarehouseManager, loginUser, UserCredentials } from './testUtils';
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
        password: 'superadminPassword123',
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
                password: 'Password123',
                name: 'Тестовый Админ',
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
                    email: '',
                    password: 'Password123',
                    name: 'Некорректный Админ',
                });

            expect(res.statusCode).toBe(422);
            expect(res.body.error).toBe(MESSAGES.EMAIL_REQUIRED_FIELD);
        });

        it('Должен выбросить ошибку 409, если пользователь уже существует', async () => {
            await request(application.app)
                .post('/users/admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'admin@test.com',
                    password: 'Password123',
                    name: 'Тестовый Админ',
                });

            const res = await request(application.app)
                .post('/users/admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'admin@test.com',
                    password: 'Password123',
                    name: 'Тестовый Админ',
                });

            expect(res.statusCode).toBe(409);
            expect(res.body.error).toBe(MESSAGES.EMAIL_ALREADY_EXISTS);
        });

        it('Должен выбросить ошибку 422, если пароль слабый', async () => {
            const res = await request(application.app)
                .post('/users/admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'weakadmin@test.com',
                    password: 'weak',
                    name: 'Слабый Админ',
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
                    password: 'Password123',
                    name: 'Другой Админ',
                });

            const { token: otherAdminToken } = await loginUser(application.app, {
                email: 'otheradmin@test.com',
                password: 'Password123',
            });

            const res = await request(application.app)
                .post('/users/admin')
                .set('Authorization', `Bearer ${otherAdminToken}`)
                .send({
                    email: 'newadmin@test.com',
                    password: 'Password123',
                    name: 'Новый Админ',
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe(MESSAGES.FORBIDDEN_ACCESS);
        });
    });

    describe('Регистрация менеджера склада', () => {
        it('Должен успешно зарегистрировать менеджера склада', async () => {
            const { managerId, managerEmail } = await createTestWarehouseManager(application.app, adminToken);
            const res = await request(application.app)
                .get('/users/warehouse-managers')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.items).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: managerId,
                        email: managerEmail,
                        role: 'WAREHOUSE_MANAGER',
                    }),
                ]),
            );
        });

        it('Должен выбросить ошибку 409, если менеджер склада уже существует', async () => {
            await cleanUp(prisma);
            const { managerEmail } = await createTestWarehouseManager(application.app, adminToken);
            const res = await request(application.app)
                .post('/users/warehouse-manager')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: managerEmail,
                    password: 'Password123',
                    name: 'Тестовый Начальник склада',
                });

            expect(res.statusCode).toBe(409);
            expect(res.body.error).toBe(MESSAGES.EMAIL_ALREADY_EXISTS);
        });

        it('Должен выбросить ошибку 422, если имя отсутствует', async () => {
            const res = await request(application.app)
                .post('/users/warehouse-manager')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'noname@test.com',
                    password: 'Password123',
                });

            expect(res.statusCode).toBe(422);
            expect(res.body.error).toBe(MESSAGES.NAME_REQUIRED_FIELD);
        });
    });

    describe('Авторизация', () => {
        it('Должен успешно войти в систему', async () => {
            const { managerEmail } = await createTestWarehouseManager(application.app, adminToken);
            const { status, token, error } = await loginUser(application.app, {
                email: managerEmail,
                password: 'Password123',
            });

            console.log('Login test response:', { status, token, error });
            expect(status).toBe(200);
            expect(token).toBeDefined();
        });

        it('Должен выбросить ошибку 401, если учетные данные неверны', async () => {
            const { managerEmail } = await createTestWarehouseManager(application.app, adminToken);
            const { status, error } = await loginUser(application.app, {
                email: managerEmail,
                password: 'wrongPassword123',
            });

            expect(status).toBe(401);
            expect(error).toBe(MESSAGES.INVALID_CREDENTIALS);
        });

        it('Должен выбросить ошибку 401, если пользователь не существует', async () => {
            const { status, error } = await loginUser(application.app, {
                email: 'nonexistent@test.com',
                password: 'Password123',
            });

            expect(status).toBe(401);
            expect(error).toBe(MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('Обновление пароля менеджера склада', () => {
        it('Должен успешно обновить пароль', async () => {
            const { managerId, managerEmail } = await createTestWarehouseManager(application.app, adminToken);
            const res = await request(application.app)
                .patch(`/users/warehouse-manager/${managerId}/password`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ newPassword: 'newPassword123', oldPassword: 'Password123' });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe(MESSAGES.PASSWORD_UPDATED);

            const { status } = await loginUser(application.app, {
                email: managerEmail,
                password: 'newPassword123',
            });

            expect(status).toBe(200);
        });

        it('Должен выбросить ошибку 404, если ID менеджера склада неверный', async () => {
            const res = await request(application.app)
                .patch('/users/warehouse-manager/9999/password')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ newPassword: 'newPassword123', oldPassword: 'Password123' });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe(MESSAGES.USER_NOT_FOUND);
        });

        it('Должен выбросить ошибку 422, если пароль слабый', async () => {
            const { managerId } = await createTestWarehouseManager(application.app, adminToken);
            const res = await request(application.app)
                .patch(`/users/warehouse-manager/${managerId}/password`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ newPassword: 'weak' });

            expect(res.statusCode).toBe(422);
            expect(res.body.error).toBe(MESSAGES.NEW_PASSWORD_COMPLEXITY);
        });

        it('Должен выбросить ошибку 422, если пароль пустой', async () => {
            const { managerId } = await createTestWarehouseManager(application.app, adminToken);
            const res = await request(application.app)
                .patch(`/users/warehouse-manager/${managerId}/password`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ newPassword: '' });

            expect(res.statusCode).toBe(422);
            expect(res.body.error).toBe(MESSAGES.NEW_PASSWORD_REQUIRED_FIELD);
        });
    });

    describe('Удаление менеджера склада', () => {
        it('Должен успешно удалить менеджера склада', async () => {
            const { managerId } = await createTestWarehouseManager(application.app, adminToken);
            const res = await request(application.app)
                .delete(`/users/warehouse-manager/${managerId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe(MESSAGES.USER_DELETED);
        });

        it('Должен выбросить ошибку 422, если у менеджера склада есть активные товары', async () => {
            const { managerId, managerToken } = await createTestWarehouseManager(application.app, adminToken);

            const productRes = await request(application.app)
                .post('/products/propose')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    name: 'Test Product',
                    description: 'Test Description',
                    price: 100,
                    quantity: 10,
                    category: 'Test Category',
                    sku: `SKU-${Date.now()}`,
                    categoryIds: [1],
                    isActive: true,
                    cityId: 1,
                });

            expect(productRes.statusCode).toBe(201);

            const res = await request(application.app)
                .delete(`/users/warehouse-manager/${managerId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(422);
            expect(res.body.error).toBe(MESSAGES.WAREHOUSE_MANAGER_HAS_ACTIVE_PRODUCTS);
        });

        it('Должен выбросить ошибку 404, если ID менеджера склада неверный', async () => {
            const res = await request(application.app)
                .delete('/users/warehouse-manager/9999')
                .set('Authorization', `Bearer ${adminToken}`);

            console.log('Response for invalid ID:', res.statusCode, res.body);
            expect(res.statusCode).toBe(404);
            expect(res.body.error || res.body.message).toBe(MESSAGES.USER_NOT_FOUND);
        });
    });

    describe('Получение списка менеджеров склада', () => {
        it('Должен успешно получить список менеджеров склада', async () => {
            await createTestWarehouseManager(application.app, adminToken);
            const res = await request(application.app)
                .get('/users/warehouse-managers')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
        });
    });
});