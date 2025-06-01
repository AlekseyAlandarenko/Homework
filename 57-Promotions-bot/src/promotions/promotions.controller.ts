import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { ILogger } from '../logger/logger.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import 'reflect-metadata';
import { IPromotionsController } from './promotions.controller.interface';
import { PromotionCreateOrProposeDto } from './dto/promotion-create-or-propose.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import { PromotionStatusDto } from './dto/promotion-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { IPromotionsService } from './promotions.service.interface';
import { MESSAGES } from '../common/messages';

/**
 * @swagger
 * tags:
 *   name: Promotions
 *   description: Управление акциями
 */
@injectable()
export class PromotionsController extends BaseController implements IPromotionsController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.PromotionsService) private promotionsService: IPromotionsService,
	) {
		super(loggerService);
		this.bindRoutes([
			{
				path: '/',
				method: 'post',
				func: this.createPromotion,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(PromotionCreateOrProposeDto),
				],
			},
			{
				path: '/propose',
				method: 'post',
				func: this.createPromotion,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPPLIER']),
					new ValidateMiddleware(PromotionCreateOrProposeDto),
				],
			},
			{
				path: '/',
				method: 'get',
				func: this.getAllPromotions,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(PaginationDto),
				],
			},
			{
				path: '/my',
				method: 'get',
				func: this.getMyPromotions,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPPLIER']),
					new ValidateMiddleware(PaginationDto),
				],
			},
			{
				path: '/:id',
				method: 'get',
				func: this.getPromotionById,
				middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN', 'SUPPLIER'])],
			},
			{
				path: '/:id',
				method: 'patch',
				func: this.updatePromotion,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(PromotionUpdateDto),
				],
			},
			{
				path: '/:id/status',
				method: 'patch',
				func: this.updatePromotionStatus,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(PromotionStatusDto),
				],
			},
			{
				path: '/:id',
				method: 'delete',
				func: this.deletePromotion,
				middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN'])],
			},
		]);
	}

	/**
	 * @swagger
	 * /promotions:
	 *   post:
	 *     tags: [Promotions]
	 *     summary: Создание акции
	 *     description: Создает акцию со статусом APPROVED. Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/PromotionCreateOrProposeDto'
	 *     responses:
	 *       201:
	 *         description: Акция создана
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Акция успешно создана"
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации данных
	 * /promotions/propose:
	 *   post:
	 *     tags: [Promotions]
	 *     summary: Предложение акции
	 *     description: Создает акцию со статусом PENDING от имени поставщика. Доступно для SUPPLIER.
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/PromotionCreateOrProposeDto'
	 *     responses:
	 *       201:
	 *         description: Акция предложена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Акция успешно создана"
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async createPromotion(
		{ body, path, user }: Request<{}, {}, PromotionCreateOrProposeDto & { supplierId?: number }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const status = path.includes('propose') ? 'PENDING' : 'APPROVED';
			const promotion = await this.promotionsService.createPromotion({
				...body,
				userEmail: user?.email,
				status,
			});
			this.created(res, { message: MESSAGES.PROMOTION_CREATED, data: promotion });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions:
	 *   get:
	 *     tags: [Promotions]
	 *     summary: Получение списка акций
	 *     description: Возвращает список всех акций с фильтрацией, сортировкой и пагинацией. Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: status
	 *         schema:
	 *           type: string
	 *           enum: [PENDING, APPROVED, REJECTED]
	 *         description: Фильтр по статусу акции.
	 *       - in: query
	 *         name: active
	 *         schema:
	 *           type: string
	 *           enum: [true, false]
	 *         description: Фильтр по активности (true — действующие, false — завершенные).
	 *       - in: query
	 *         name: sortBy
	 *         schema:
	 *           type: string
	 *           enum: [createdAt, title, startDate, endDate, status]
	 *         description: Поле сортировки.
	 *       - in: query
	 *         name: sortOrder
	 *         schema:
	 *           type: string
	 *           enum: [asc, desc]
	 *           default: asc
	 *         description: Порядок сортировки.
	 *       - in: query
	 *         name: page
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 1
	 *         description: Номер страницы.
	 *       - in: query
	 *         name: limit
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 10
	 *         description: Количество записей на странице.
	 *     responses:
	 *       200:
	 *         description: Список акций
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/PromotionResponse'
	 *                 meta:
	 *                   type: object
	 *                   properties:
	 *                     total:
	 *                       type: integer
	 *                       example: 25
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *                     totalPages:
	 *                       type: integer
	 *                       example: 3
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации параметров
	 */
	async getAllPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const { status, active, sortBy, sortOrder } = req.query as any;
			const result = await this.promotionsService.getAllPromotions({
				filters: { status, active },
				orderBy: { sortBy, sortOrder },
				pagination,
			});
			this.sendPaginatedResponse(res, result.items, result.total, pagination);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/my:
	 *   get:
	 *     tags: [Promotions]
	 *     summary: Получение акций поставщика
	 *     description: Возвращает список акций текущего поставщика с пагинацией. Доступно для SUPPLIER.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: page
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 1
	 *         description: Номер страницы.
	 *       - in: query
	 *         name: limit
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 10
	 *         description: Количество записей на странице.
	 *     responses:
	 *       200:
	 *         description: Список акций
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/PromotionResponse'
	 *                 meta:
	 *                   type: object
	 *                   properties:
	 *                     total:
	 *                       type: integer
	 *                       example: 5
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *                     totalPages:
	 *                       type: integer
	 *                       example: 1
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации параметров
	 */
	async getMyPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.promotionsService.getPromotionsBySupplier(
				req.user?.email,
				pagination,
			);
			this.sendPaginatedResponse(res, result.items, result.total, pagination);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/{id}:
	 *   get:
	 *     tags: [Promotions]
	 *     summary: Получение акции по ID
	 *     description: Возвращает данные акции. Доступно для SUPERADMIN, ADMIN (все акции) и SUPPLIER (свои акции).
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор акции.
	 *     responses:
	 *       200:
	 *         description: Данные акции
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/PromotionResponse'
	 *       400:
	 *         description: Неверный ID
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Акция не найдена
	 */
	async getPromotionById(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = parseInt(req.params.id, 10);
			const userId = req.user?.id || 0;
			const role = req.user?.role || '';
			const promotion = await this.promotionsService.getPromotionById(id, userId, role);
			this.ok(res, promotion);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/{id}:
	 *   patch:
	 *     tags: [Promotions]
	 *     summary: Обновление акции
	 *     description: Обновляет данные акции (название, описание, даты). Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор акции.
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/PromotionUpdateDto'
	 *     responses:
	 *       200:
	 *         description: Акция обновлена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Акция успешно обновлена"
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Акция не найдена
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async updatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const promotion = await this.promotionsService.updatePromotion(id, req.body);
			this.ok(res, { message: MESSAGES.PROMOTION_UPDATED, data: promotion });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/{id}/status:
	 *   patch:
	 *     tags: [Promotions]
	 *     summary: Обновление статуса акции
	 *     description: Изменяет статус акции (PENDING, APPROVED, REJECTED). Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор акции.
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/PromotionStatusDto'
	 *     responses:
	 *       200:
	 *         description: Статус обновлен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Акция успешно обновлена"
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Акция не найдена
	 *       422:
	 *         description: Ошибка валидации статуса
	 */
	async updatePromotionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const promotion = await this.promotionsService.updatePromotionStatus(id, req.body.status);
			this.ok(res, { message: MESSAGES.PROMOTION_UPDATED, data: promotion });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/{id}:
	 *   delete:
	 *     tags: [Promotions]
	 *     summary: Удаление акции
	 *     description: Выполняет мягкое удаление акции, если она не активна (APPROVED и в период действия). Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор акции.
	 *     responses:
	 *       200:
	 *         description: Акция удалена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Акция успешно удалена"
	 *       400:
	 *         description: Нельзя удалить активную акцию
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Акция не найдена
	 */
	async deletePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.promotionsService.deletePromotion(id);
			this.ok(res, { message: MESSAGES.PROMOTION_DELETED });
		} catch (err) {
			next(err);
		}
	}
}
