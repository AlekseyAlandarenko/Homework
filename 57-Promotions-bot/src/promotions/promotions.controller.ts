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
import { PromotionsFilterDto } from './dto/promotion-filter.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { IPromotionsService } from './promotions.service.interface';
import { MESSAGES } from '../common/messages';
import { ADMIN_ROLES, FULL_ACCESS_ROLES } from '../common/constants';
import { ValidateIdMiddleware } from '../common/validate-id.middleware';
import { Role } from '../common/enums/role.enum';
import { PromotionStatus } from '../common/enums/promotion-status.enum';

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
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PromotionCreateOrProposeDto),
				],
			},
			{
				path: '/propose',
				method: 'post',
				func: this.createPromotion,
				middlewares: [
					new AuthGuard(),
					new RoleGuard([Role.SUPPLIER]),
					new ValidateMiddleware(PromotionCreateOrProposeDto),
				],
			},
			{
				path: '/',
				method: 'get',
				func: this.getAllPromotions,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PaginationDto),
					new ValidateMiddleware(PromotionsFilterDto),
				],
			},
			{
				path: '/my',
				method: 'get',
				func: this.getMyPromotions,
				middlewares: [
					new AuthGuard(),
					new RoleGuard([Role.SUPPLIER]),
					new ValidateMiddleware(PaginationDto),
				],
			},
			{
				path: '/:id',
				method: 'get',
				func: this.getPromotionById,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id',
				method: 'patch',
				func: this.updatePromotion,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PromotionUpdateDto),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id/status',
				method: 'patch',
				func: this.updatePromotionStatus,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PromotionStatusDto),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id',
				method: 'delete',
				func: this.deletePromotion,
				middlewares: [new AuthGuard(), new RoleGuard(ADMIN_ROLES), new ValidateIdMiddleware()],
			},
		]);
	}

	private sendSuccess<T>(res: Response, message: string, data: T): void {
		this.ok(res, { message, data });
	}

	private sendCreated<T>(res: Response, message: string, data: T): void {
		this.created(res, { message, data });
	}

	/**
	 * @swagger
	 * /promotions:
	 *   post:
	 *     summary: Создание акции администратором
	 *     tags: [Promotions]
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
	 *         description: Акция успешно создана
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Акция успешно создана
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Доступ запрещен
	 *       404:
	 *         description: Поставщик не найден
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Поставщик не найден
	 *       409:
	 *         description: Акция с таким заголовком уже существует
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Акция с таким заголовком уже существует
	 *       422:
	 *         description: Ошибка валидации
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Поле "Название" обязательно
	 */
	/**
	 * @swagger
	 * /promotions/propose:
	 *   post:
	 *     summary: Предложение акции поставщиком
	 *     tags: [Promotions]
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
	 *         description: Акция успешно предложена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Акция успешно создана
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Доступ запрещен
	 *       404:
	 *         description: Поставщик не найден
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Поставщик не найден
	 *       409:
	 *         description: Акция с таким заголовком уже существует
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Акция с таким заголовком уже существует
	 *       422:
	 *         description: Ошибка валидации
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Поле "Название" обязательно
	 */
	async createPromotion(
		{ body, path, user }: Request<{}, {}, PromotionCreateOrProposeDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const status = path === '/propose' ? PromotionStatus.PENDING : PromotionStatus.APPROVED;
			const supplierId = path === '/propose' ? user!.id : body.supplierId || user!.id;
			const promotion = await this.promotionsService.createPromotion({
				...body,
				status,
				supplierId,
			});
			this.sendCreated(res, MESSAGES.PROMOTION_CREATED, promotion);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions:
	 *   get:
	 *     summary: Получение списка всех акций (для администраторов)
	 *     tags: [Promotions]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - $ref: '#/components/parameters/PaginationPage'
	 *       - $ref: '#/components/parameters/PaginationLimit'
	 *       - $ref: '#/components/parameters/PromotionStatus'
	 *       - $ref: '#/components/parameters/PromotionActive'
	 *       - $ref: '#/components/parameters/PromotionCityId'
	 *       - $ref: '#/components/parameters/PromotionCategoryIds'
	 *       - $ref: '#/components/parameters/SortBy'
	 *       - $ref: '#/components/parameters/SortOrder'
	 *     responses:
	 *       200:
	 *         description: Список акций успешно получен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Список акций успешно получен
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     items:
	 *                       type: array
	 *                       items:
	 *                         $ref: '#/components/schemas/PromotionResponse'
	 *                     total:
	 *                       type: integer
	 *                       example: 100
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации параметров
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Поле "Страница" должно быть целым числом ≥ 1
	 */
	async getAllPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const filters: PromotionsFilterDto = {
				status: req.query.status as PromotionStatus,
				active:
					req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
				cityId: req.query.cityId ? Number(req.query.cityId) : undefined,
				categoryIds: req.query.categoryIds as number[] | undefined,
				sortBy: req.query.sortBy as string,
				sortOrder: req.query.sortOrder as string,
			};
			const result = await this.promotionsService.getAllPromotions({ filters, pagination });
			this.sendSuccess(res, MESSAGES.PROMOTIONS_RETRIEVED, {
				items: result.items,
				total: result.total,
				page: pagination.page,
				limit: pagination.limit,
			});
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/my:
	 *   get:
	 *     summary: Получение списка акций текущего поставщика
	 *     tags: [Promotions]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - $ref: '#/components/parameters/PaginationPage'
	 *       - $ref: '#/components/parameters/PaginationLimit'
	 *     responses:
	 *       200:
	 *         description: Список акций успешно получен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Список акций успешно получен
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     items:
	 *                       type: array
	 *                       items:
	 *                         $ref: '#/components/schemas/PromotionResponse'
	 *                     total:
	 *                       type: integer
	 *                       example: 10
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации параметров
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Поле "Страница" должно быть целым числом ≥ 1
	 */
	async getMyPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.promotionsService.getPromotionsBySupplier(req.user!.id, pagination);
			this.sendSuccess(res, MESSAGES.PROMOTIONS_RETRIEVED, {
				items: result.items,
				total: result.total,
				page: pagination.page,
				limit: pagination.limit,
			});
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/{id}:
	 *   get:
	 *     summary: Получение акции по ID
	 *     tags: [Promotions]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор акции
	 *     responses:
	 *       200:
	 *         description: Акция успешно получена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Список акций успешно получен
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Доступ запрещен
	 *       404:
	 *         description: Акция не найдена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Акция не найдена
	 *       422:
	 *         description: Неверный формат ID
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Неверный формат ID
	 */
	async getPromotionById(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const userId = req.user?.id;
			const userRole = req.user?.role;
			const promotion = await this.promotionsService.getPromotionById(id, userId, userRole);
			this.sendSuccess(res, MESSAGES.PROMOTIONS_RETRIEVED, promotion);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/{id}:
	 *   patch:
	 *     summary: Обновление акции
	 *     tags: [Promotions]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор акции
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/PromotionUpdateDto'
	 *     responses:
	 *       200:
	 *         description: Акция успешно обновлена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Акция успешно обновлена
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Доступ запрещен
	 *       404:
	 *         description: Акция не найдена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Акция не найдена
	 *       409:
	 *         description: Акция с таким заголовком уже существует
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Акция с таким заголовком уже существует
	 *       422:
	 *         description: Ошибка валидации
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Поле "Название" имеет недействительный формат
	 */
	async updatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const promotion = await this.promotionsService.updatePromotion(id, req.body);
			this.sendSuccess(res, MESSAGES.PROMOTION_UPDATED, promotion);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/{id}/status:
	 *   patch:
	 *     summary: Обновление статуса акции
	 *     tags: [Promotions]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор акции
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/PromotionStatusDto'
	 *     responses:
	 *       200:
	 *         description: Статус акции успешно обновлен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Акция успешно обновлена
	 *                 data:
	 *                   $ref: '#/components/schemas/PromotionResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Доступ запрещен
	 *       404:
	 *         description: Акция не найдена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Акция не найдена
	 *       422:
	 *         description: Ошибка валидации
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Недействительный статус акции
	 */
	async updatePromotionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const promotion = await this.promotionsService.updatePromotionStatus(id, req.body.status);
			this.sendSuccess(res, MESSAGES.PROMOTION_UPDATED, promotion);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /promotions/{id}:
	 *   delete:
	 *     summary: Удаление акции (мягкое удаление)
	 *     tags: [Promotions]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор акции
	 *     responses:
	 *       200:
	 *         description: Акция успешно удалена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Акция успешно удалена
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     id:
	 *                       type: integer
	 *                       example: 1
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Доступ запрещен
	 *       404:
	 *         description: Акция не найдена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Акция не найдена
	 *       422:
	 *         description: Нельзя удалить активную акцию
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   example: Нельзя удалить активную акцию
	 */
	async deletePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.promotionsService.deletePromotion(id);
			this.sendSuccess(res, MESSAGES.PROMOTION_DELETED, { id });
		} catch (err) {
			next(err);
		}
	}
}
