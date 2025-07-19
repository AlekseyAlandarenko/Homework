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
} from '../tests/testUtils';
import { MESSAGES } from '../src/common/messages';
import { PromotionStatus } from '../src/common/enums/promotion-status.enum';

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
			title: 'Акция Админа',
			description: 'Акция, созданная админом',
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
				title: 'Акция Админа',
				status: PromotionStatus.APPROVED,
			});
		});

		it('Должен выбросить ошибку 404, если поставщик не существует', async () => {
			const res = await request(application.app)
				.post('/promotions')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...validPromotionData, supplierId: 9999 });

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.USER_NOT_FOUND);
		});

		it('Должен выбросить ошибку 401, если токен отсутствует', async () => {
			const res = await request(application.app)
				.post('/promotions')
				.send({ ...validPromotionData, supplierId });

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.UNAUTHORIZED);
		});

		it('Должен выбросить ошибку 401, если токен некорректен', async () => {
			const res = await request(application.app)
				.post('/promotions')
				.set('Authorization', 'Bearer malformed.token.here')
				.send({ ...validPromotionData, supplierId });

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
		});

		it('Должен выбросить ошибку 422, если название отсутствует', async () => {
			const { title, ...invalidData } = validPromotionData;
			const res = await request(application.app)
				.post('/promotions')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ ...invalidData, supplierId });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.TITLE_REQUIRED_FIELD);
		});

		it('Должен выбросить ошибку 422, если дата окончания раньше даты начала', async () => {
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
			title: 'Акция Поставщика',
			description: 'Акция, предложенная поставщиком',
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
				title: 'Акция Поставщика',
				status: PromotionStatus.PENDING,
			});
		});

		it('Должен выбросить ошибку 422, если дата начала в прошлом', async () => {
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

		it('Должен выбросить ошибку 422, если дата окончания раньше даты начала', async () => {
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
				title: 'Акция Б',
				startDate: new Date(Date.now() + 86400000).toISOString(),
			});
			const promoA = await createTestPromotion(application.app, adminToken, supplierId, {
				title: 'Акция А',
				startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
				endDate: new Date(Date.now() + 3 * 86400000).toISOString(),
			});

			expect(promoB.status).toBe(201);
			expect(promoA.status).toBe(201);
		});

		it('Должен получить все промоакции с фильтром по статусу', async () => {
			for (let i = 1; i <= 5; i++) {
				const result = await createTestPromotion(application.app, adminToken, supplierId, {
					title: `Тестовая Акция ${i}`,
				});
				expect(result.status).toBe(201);
			}

			const res = await request(application.app)
				.get('/promotions?status=APPROVED')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toHaveLength(7);
			expect(res.body.data.items.every((p: any) => p.status === PromotionStatus.APPROVED)).toBe(
				true,
			);
		});

		it('Должен получить все промоакции без фильтра', async () => {
			const res = await request(application.app)
				.get('/promotions')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
		});

		it('Должен получить все промоакции с сортировкой по названию (asc)', async () => {
			const res = await request(application.app)
				.get('/promotions')
				.set('Authorization', `Bearer ${adminToken}`)
				.query({ sortBy: 'title', sortOrder: 'asc' });

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toHaveLength(2);
			expect(res.body.data.items[0].title).toBe('Акция А');
			expect(res.body.data.items[1].title).toBe('Акция Б');
		});

		it('Должен получить все промоакции с сортировкой по дате начала (desc)', async () => {
			const res = await request(application.app)
				.get('/promotions')
				.set('Authorization', `Bearer ${adminToken}`)
				.query({ sortBy: 'startDate', sortOrder: 'desc' });

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toHaveLength(2);
			expect(res.body.data.items[0].title).toBe('Акция А');
			expect(res.body.data.items[1].title).toBe('Акция Б');
		});

		it('Должен выбросить ошибку 422, если параметр сортировки некорректен', async () => {
			const res = await request(application.app)
				.get('/promotions')
				.set('Authorization', `Bearer ${adminToken}`)
				.query({ sortBy: 'invalidField', sortOrder: 'asc' });

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.SORT_BY_INVALID_FORMAT);
		});

		it('Должен выбросить ошибку 401, если токен некорректен', async () => {
			const res = await request(application.app)
				.get('/promotions')
				.set('Authorization', 'Bearer invalid-token');

			expect(res.statusCode).toBe(401);
			expect(res.body.error).toBe(MESSAGES.INVALID_TOKEN);
		});

		it('Должен выбросить ошибку 403, если роль пользователя — поставщик', async () => {
			const res = await request(application.app)
				.get('/promotions')
				.set('Authorization', `Bearer ${supplierToken}`);

			expect(res.statusCode).toBe(403);
			expect(res.body.error).toBe(MESSAGES.FORBIDDEN_ACCESS);
		});
	});

	describe('Получение моих промоакций', () => {
		it('Должен успешно получить промоакции поставщика', async () => {
			await request(application.app)
				.post('/promotions/propose')
				.set('Authorization', `Bearer ${supplierToken}`)
				.send({
					title: 'Моя Акция',
					description: 'Мое Описание',
					startDate: new Date(Date.now() + 86400000).toISOString(),
					endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
				});

			const res = await request(application.app)
				.get('/promotions/my')
				.set('Authorization', `Bearer ${supplierToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toEqual(
				expect.arrayContaining([expect.objectContaining({ title: 'Моя Акция' })]),
			);
		});

		it('Должен выбросить ошибку 403, если пользователь не поставщик', async () => {
			const res = await request(application.app)
				.get('/promotions/my')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(403);
			expect(res.body.error).toBe(MESSAGES.FORBIDDEN_ACCESS);
		});
	});

	describe('Обновление промоакции', () => {
		it('Должен успешно обновить промоакцию', async () => {
			const { data: promotion } = await createTestPromotion(
				application.app,
				adminToken,
				supplierId,
			);
			const res = await request(application.app)
				.patch(`/promotions/${promotion.id}`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({
					title: 'Обновленная Акция',
					description: 'Обновленное Описание',
				});

			expect(res.statusCode).toBe(200);
			expect(res.body.data).toMatchObject({ title: 'Обновленная Акция' });
		});

		it('Должен минимально обновить промоакцию', async () => {
			const { data: promotion } = await createTestPromotion(
				application.app,
				adminToken,
				supplierId,
			);
			const res = await request(application.app)
				.patch(`/promotions/${promotion.id}`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ title: 'Минимально Обновленная' });

			expect(res.statusCode).toBe(200);
			expect(res.body.data).toMatchObject({ title: 'Минимально Обновленная' });
		});

		it('Должен выбросить ошибку 404, если ID промоакции неверный', async () => {
			const res = await request(application.app)
				.patch('/promotions/9999')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ title: 'Некорректное Обновление' });

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.PROMOTION_NOT_FOUND);
		});

		it('Должен выбросить ошибку 422, если даты некорректны', async () => {
			const { data: promotion } = await createTestPromotion(
				application.app,
				adminToken,
				supplierId,
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

		it('Должен выбросить ошибку 422, если обновление пустое', async () => {
			const { data: promotion } = await createTestPromotion(
				application.app,
				adminToken,
				supplierId,
			);
			const res = await request(application.app)
				.patch(`/promotions/${promotion.id}`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({});

			expect(res.statusCode).toBe(422);
			expect(res.body.error).toBe(MESSAGES.NON_EMPTY_OBJECT_VALIDATION_FAILED);
		});
	});

	describe('Обновление статуса промоакции', () => {
		it('Должен успешно обновить статус промоакции', async () => {
			const proposeRes = await request(application.app)
				.post('/promotions/propose')
				.set('Authorization', `Bearer ${supplierToken}`)
				.send({
					title: 'Акция для Статуса',
					description: 'Ожидает утверждения',
					startDate: new Date(Date.now() + 86400000).toISOString(),
					endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
				});

			expect(proposeRes.statusCode).toBe(201);
			const promotionId = proposeRes.body.data.id;

			const res = await request(application.app)
				.patch(`/promotions/${promotionId}/status`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ status: PromotionStatus.APPROVED });

			expect(res.statusCode).toBe(200);
			expect(res.body.data).toMatchObject({ status: PromotionStatus.APPROVED });
		});

		it('Должен выбросить ошибку 422, если статус некорректен', async () => {
			const proposeRes = await request(application.app)
				.post('/promotions/propose')
				.set('Authorization', `Bearer ${supplierToken}`)
				.send({
					title: 'Акция с Некорректным Статусом',
					description: 'Некорректный Статус',
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
			expect(res.body.error).toBe(MESSAGES.STATUS_INVALID_FORMAT);
		});

		it('Должен выбросить ошибку 404, если промоакция не существует', async () => {
			const res = await request(application.app)
				.patch('/promotions/9999/status')
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ status: PromotionStatus.APPROVED });

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.PROMOTION_NOT_FOUND);
		});
	});

	describe('Публикация утвержденных промоакций', () => {
		it('Должен успешно отобразить утвержденную акцию поставщика в общем списке', async () => {
			const proposeRes = await request(application.app)
				.post('/promotions/propose')
				.set('Authorization', `Bearer ${supplierToken}`)
				.send({
					title: 'Утвержденная Акция Поставщика',
					description: 'Описание Поставщика',
					startDate: new Date(Date.now() + 86400000).toISOString(),
					endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
				});

			expect(proposeRes.statusCode).toBe(201);
			const promotionId = proposeRes.body.data.id;

			await request(application.app)
				.patch(`/promotions/${promotionId}/status`)
				.set('Authorization', `Bearer ${adminToken}`)
				.send({ status: PromotionStatus.APPROVED })
				.expect(200);

			const res = await request(application.app)
				.get('/promotions')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: promotionId,
						title: 'Утвержденная Акция Поставщика',
						status: PromotionStatus.APPROVED,
					}),
				]),
			);
		});

		it('Должен успешно отобразить акцию, созданную администратором, в общем списке', async () => {
			const createRes = await createTestPromotion(application.app, adminToken, supplierId, {
				title: 'Утвержденная Акция Админа',
			});

			expect(createRes.status).toBe(201);
			const promotionId = createRes.data.id;

			const res = await request(application.app)
				.get('/promotions')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.data.items).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: promotionId,
						title: 'Утвержденная Акция Админа',
						status: PromotionStatus.APPROVED,
					}),
				]),
			);
		});
	});

	describe('Удаление промоакции', () => {
		it('Должен успешно удалить промоакцию', async () => {
			const { data: promotion } = await createTestPromotion(
				application.app,
				adminToken,
				supplierId,
			);
			const res = await request(application.app)
				.delete(`/promotions/${promotion.id}`)
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.message).toBe(MESSAGES.PROMOTION_DELETED);
		});

		it('Должен выбросить ошибку 404, если ID промоакции неверный', async () => {
			const res = await request(application.app)
				.delete('/promotions/9999')
				.set('Authorization', `Bearer ${adminToken}`);

			expect(res.statusCode).toBe(404);
			expect(res.body.error).toBe(MESSAGES.PROMOTION_NOT_FOUND);
		});

		it('Должен выбросить ошибку 403, если роль пользователя — поставщик', async () => {
			const { data: promotion } = await createTestPromotion(
				application.app,
				adminToken,
				supplierId,
			);
			const res = await request(application.app)
				.delete(`/promotions/${promotion.id}`)
				.set('Authorization', `Bearer ${supplierToken}`);

			expect(res.statusCode).toBe(403);
			expect(res.body.error).toBe(MESSAGES.FORBIDDEN_ACCESS);
		});
	});
});
