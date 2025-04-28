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
        method: 'get',
        func: this.getAll,
        middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN'])],
      },
      {
        path: '/my',
        method: 'get',
        func: this.getMyPromotions,
        middlewares: [new AuthGuard(), new RoleGuard(['SUPPLIER'])],
      },
      {
        path: '/',
        method: 'post',
        func: this.create,
        middlewares: [
          new AuthGuard(),
          new RoleGuard(['SUPERADMIN', 'ADMIN']),
          new ValidateMiddleware(PromotionCreateOrProposeDto),
        ],
      },
      {
        path: '/propose',
        method: 'post',
        func: this.propose,
        middlewares: [
          new AuthGuard(),
          new RoleGuard(['SUPPLIER']),
          new ValidateMiddleware(PromotionCreateOrProposeDto),
        ],
      },
      {
        path: '/:id',
        method: 'patch',
        func: this.update,
        middlewares: [
          new AuthGuard(),
          new RoleGuard(['SUPERADMIN', 'ADMIN']),
          new ValidateMiddleware(PromotionUpdateDto),
        ],
      },
      {
        path: '/:id/status',
        method: 'patch',
        func: this.updateStatus,
        middlewares: [
          new AuthGuard(),
          new RoleGuard(['SUPERADMIN', 'ADMIN']),
          new ValidateMiddleware(PromotionStatusDto),
        ],
      },
      {
        path: '/:id',
        method: 'delete',
        func: this.delete,
        middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN'])],
      },
    ]);
  }

  /**
   * @swagger
   * /promotions:
   *   get:
   *     tags: [Promotions]
   *     summary: Получение списка акций
   *     description: Возвращает список всех акций с фильтрацией и сортировкой (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, APPROVED, REJECTED]
   *         description: Фильтр по статусу акции
   *       - in: query
   *         name: active
   *         schema:
   *           type: string
   *           enum: [true, false]
   *         description: Фильтр по активности акции
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, title, startDate, endDate, status]
   *         description: Поле для сортировки
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *         description: Порядок сортировки
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Номер страницы
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Количество записей на странице
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
   *                       type: number
   *                       example: 25
   *                     page:
   *                       type: number
   *                       example: 1
   *                     limit:
   *                       type: number
   *                       example: 10
   *                     totalPages:
   *                       type: number
   *                       example: 3
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, sortBy, sortOrder, active, page, limit } = req.query;

      const filters = {
        status: typeof status === 'string' ? status : undefined,
        active: typeof active === 'string' ? active : undefined,
      };
      const orderBy = {
        sortBy: typeof sortBy === 'string' ? sortBy : undefined,
        sortOrder: typeof sortOrder === 'string' ? sortOrder : undefined,
      };
      const pagination = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
      };

      const result = await this.promotionsService.getAllPromotions({
        filters,
        orderBy,
        pagination,
      });
      this.ok(res, {
        data: result.items,
        meta: {
          total: result.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /promotions/my:
   *   get:
   *     tags: [Promotions]
   *     summary: Получение акций текущего поставщика
   *     description: Возвращает список акций текущего аутентифицированного поставщика
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Номер страницы
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Количество записей на странице
   *     responses:
   *       200:
   *         description: Список акций поставщика
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
   *                       type: number
   *                       example: 5
   *                     page:
   *                       type: number
   *                       example: 1
   *                     limit:
   *                       type: number
   *                       example: 10
   *                     totalPages:
   *                       type: number
   *                       example: 1
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен (только для поставщиков)
   */
  async getMyPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.promotionsService.getPromotionsBySupplier(req.user?.email, {
        page,
        limit,
      });
      this.ok(res, {
        data: result.items,
        meta: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /promotions:
   *   post:
   *     tags: [Promotions]
   *     summary: Создание акции
   *     description: Создает новую акцию (только для ADMIN и SUPERADMIN)
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
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       422:
   *         description: Ошибка валидации
   */
  async create(
    req: Request<{}, {}, PromotionCreateOrProposeDto & { supplierId?: number }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const promotion = await this.promotionsService.createPromotion({
        ...req.body,
        userEmail: req.user?.email,
        status: 'APPROVED',
      });
      this.created(res, { message: MESSAGES.PROMOTION_CREATED, data: promotion });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /promotions/propose:
   *   post:
   *     tags: [Promotions]
   *     summary: Предложение акции
   *     description: Предлагает новую акцию (только для поставщиков)
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
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       422:
   *         description: Ошибка валидации
   */
  async propose(
    req: Request<{}, {}, PromotionCreateOrProposeDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const promotion = await this.promotionsService.createPromotion({
        ...req.body,
        userEmail: req.user?.email,
        status: 'PENDING',
      });
      this.created(res, { message: MESSAGES.PROMOTION_CREATED, data: promotion });
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
   *     description: Обновляет данные акции (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID акции
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
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       404:
   *         description: Акция не найдена
   *       422:
   *         description: Ошибка валидации
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
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
   *     description: Обновляет статус акции (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID акции
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
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       404:
   *         description: Акция не найдена
   *       422:
   *         description: Ошибка валидации
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
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
   *     description: Удаляет акцию (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID акции
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
   *       400:
   *         description: Нельзя удалить активную акцию
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       404:
   *         description: Акция не найдена
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await this.promotionsService.deletePromotion(id);
      this.ok(res, { message: MESSAGES.PROMOTION_DELETED });
    } catch (err) {
      next(err);
    }
  }
}