import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { ILogger } from '../logger/logger.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import 'reflect-metadata';
import { IUsersController } from './users.controller.interface';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserUpdatePasswordDto } from './dto/user-update-password.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { IUsersService } from './users.service.interface';
import { MESSAGES } from '../common/messages';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользователями
 */
@injectable()
export class UsersController extends BaseController implements IUsersController {
  constructor(
    @inject(TYPES.ILogger) private loggerService: ILogger,
    @inject(TYPES.UsersService) private usersService: IUsersService,
  ) {
    super(loggerService);
    this.bindRoutes([
      {
        path: '/admin',
        method: 'post',
        func: this.registerAdmin,
        middlewares: [
          new AuthGuard(),
          new RoleGuard(['SUPERADMIN']),
          new ValidateMiddleware(UserRegisterDto),
        ],
      },
      {
        path: '/supplier',
        method: 'post',
        func: this.registerSupplier,
        middlewares: [
          new AuthGuard(),
          new RoleGuard(['SUPERADMIN', 'ADMIN']),
          new ValidateMiddleware(UserRegisterDto),
        ],
      },
      {
        path: '/login',
        method: 'post',
        func: this.login,
        middlewares: [new ValidateMiddleware(UserLoginDto)],
      },
      {
        path: '/suppliers',
        method: 'get',
        func: this.getAllSuppliers,
        middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN'])],
      },
      {
        path: '/supplier/:id/password',
        method: 'patch',
        func: this.updateSupplierPassword,
        middlewares: [
          new AuthGuard(),
          new RoleGuard(['SUPERADMIN', 'ADMIN']),
          new ValidateMiddleware(UserUpdatePasswordDto),
        ],
      },
      {
        path: '/supplier/:id',
        method: 'delete',
        func: this.deleteSupplier,
        middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN'])],
      },
    ]);
  }

  /**
   * @swagger
   * /users/admin:
   *   post:
   *     tags: [Users]
   *     summary: Создание администратора
   *     description: Создает нового администратора (только для SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserRegisterDto'
   *     responses:
   *       201:
   *         description: Администратор успешно создан
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Пользователь успешно создан
   *                 data:
   *                   type: object
   *                   properties:
   *                     email:
   *                       type: string
   *                       example: admin@example.com
   *                     id:
   *                       type: number
   *                       example: 1
   *                     role:
   *                       type: string
   *                       example: ADMIN
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       422:
   *         description: Ошибка валидации
   */
  async registerAdmin(
    { body }: Request<{}, {}, UserRegisterDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.usersService.createAdmin(body);
      this.created(res, {
        message: MESSAGES.USER_CREATED,
        data: { email: result.email, id: result.id, role: result.role },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /users/supplier:
   *   post:
   *     tags: [Users]
   *     summary: Создание поставщика
   *     description: Создает нового поставщика (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserRegisterDto'
   *     responses:
   *       201:
   *         description: Поставщик успешно создан
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Пользователь успешно создан
   *                 data:
   *                   type: object
   *                   properties:
   *                     email:
   *                       type: string
   *                       example: supplier@example.com
   *                     id:
   *                       type: number
   *                       example: 2
   *                     role:
   *                       type: string
   *                       example: SUPPLIER
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       422:
   *         description: Ошибка валидации
   */
  async registerSupplier(
    { body }: Request<{}, {}, UserRegisterDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.usersService.createSupplier(body);
      this.created(res, {
        message: MESSAGES.USER_CREATED,
        data: { email: result.email, id: result.id, role: result.role },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /users/login:
   *   post:
   *     tags: [Users]
   *     summary: Аутентификация пользователя
   *     description: Возвращает JWT токен для аутентификации
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserLoginDto'
   *     responses:
   *       200:
   *         description: Успешная аутентификация
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     jwt:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       401:
   *         description: Неверные учетные данные
   *       404:
   *         description: Пользователь не найден
   *       422:
   *         description: Ошибка валидации
   */
  async login(
    req: Request<{}, {}, UserLoginDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const jwt = await this.usersService.login(req.body);
      this.ok(res, { data: { jwt } });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /users/suppliers:
   *   get:
   *     tags: [Users]
   *     summary: Получение списка поставщиков
   *     description: Возвращает список всех поставщиков с пагинацией
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
   *         description: Список поставщиков
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/SupplierResponse'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: number
   *                       example: 15
   *                     page:
   *                       type: number
   *                       example: 1
   *                     limit:
   *                       type: number
   *                       example: 10
   *                     totalPages:
   *                       type: number
   *                       example: 2
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   */
  async getAllSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.usersService.getAllSuppliers({ page, limit });
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
   * /users/supplier/{id}/password:
   *   patch:
   *     tags: [Users]
   *     summary: Обновление пароля поставщика
   *     description: Обновляет пароль поставщика (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID поставщика
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserUpdatePasswordDto'
   *     responses:
   *       200:
   *         description: Пароль успешно обновлен
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Пароль успешно обновлен
   *       400:
   *         description: Неверный формат данных
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       404:
   *         description: Пользователь не найден
   *       422:
   *         description: Ошибка валидации
   */
  async updateSupplierPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await this.usersService.updateSupplierPassword(id, req.body.newPassword);
      this.ok(res, { message: MESSAGES.PASSWORD_UPDATED });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /users/supplier/{id}:
   *   delete:
   *     tags: [Users]
   *     summary: Удаление поставщика
   *     description: Удаляет поставщика (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID поставщика
   *     responses:
   *       200:
   *         description: Поставщик успешно удален
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Пользователь успешно удален
   *       400:
   *         description: Нельзя удалить поставщика с активными акциями
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       404:
   *         description: Пользователь не найден
   */
  async deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await this.usersService.deleteSupplier(id);
      this.ok(res, { message: MESSAGES.USER_DELETED });
    } catch (err) {
      next(err);
    }
  }
}