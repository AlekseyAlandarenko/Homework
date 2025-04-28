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
				path: '/warehouseManager',
				method: 'post',
				func: this.registerWarehouseManager,
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
				path: '/warehouseManagers',
				method: 'get',
				func: this.getAllWarehouseManagers,
				middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN'])],
			},
			{
				path: '/warehouseManager/:id/password',
				method: 'patch',
				func: this.updateWarehouseManagerPassword,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(UserUpdatePasswordDto),
				],
			},
			{
				path: '/warehouseManager/:id',
				method: 'delete',
				func: this.deleteWarehouseManager,
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
   *     summary: Создание начальника склада
   *     description: Создает нового начальника склада (только для ADMIN и SUPERADMIN)
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
   *         description: Начальник склада успешно создан
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
   *                       example: warehouseManager@example.com
   *                     id:
   *                       type: number
   *                       example: 2
   *                     role:
   *                       type: string
   *                       example: WAREHOUSE_MANAGER
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       422:
   *         description: Ошибка валидации
   */
	async registerWarehouseManager(
		{ body }: Request<{}, {}, UserRegisterDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const result = await this.usersService.createWarehouseManager(body);
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
   *     summary: Получение списка начальников склада
   *     description: Возвращает список всех начальников склада с пагинацией
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
   *         description: Список начальников склада
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
	async getAllWarehouseManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;
			const result = await this.usersService.getAllWarehouseManagers({ page, limit });
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
   *     summary: Обновление пароля начальника склада
   *     description: Обновляет пароль начальника склада (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID начальника склада
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
	async updateWarehouseManagerPassword(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.usersService.updateWarehouseManagerPassword(id, req.body.newPassword);
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
   *     summary: Удаление начальника склада
   *     description: Удаляет начальника склада (только для ADMIN и SUPERADMIN)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID начальника склада
   *     responses:
   *       200:
   *         description: Начальника склада успешно удален
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Пользователь успешно удален
   *       401:
   *         description: Неавторизован
   *       403:
   *         description: Доступ запрещен
   *       404:
   *         description: Пользователь не найден
   */
	async deleteWarehouseManager(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.usersService.deleteWarehouseManager(id);
			this.ok(res, { message: MESSAGES.USER_DELETED });
		} catch (err) {
			next(err);
		}
	}
}
