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
import { PaginationDto } from '../common/dto/pagination.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { IUsersService } from './users.service.interface';
import { MESSAGES } from '../common/messages';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользователями и ролями
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
				func: this.createUser,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN']),
					new ValidateMiddleware(UserRegisterDto),
				],
			},
			{
				path: '/warehouseManager',
				method: 'post',
				func: this.createUser,
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
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(PaginationDto),
				],
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
	 *     description: Создает пользователя с ролью ADMIN. Доступно для SUPERADMIN.
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
	 *         description: Администратор создан
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Пользователь успешно создан"
	 *                 data:
	 *                   $ref: '#/components/schemas/UserResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	/**
	 * @swagger
	 * /users/warehouseManager:
	 *   post:
	 *     tags: [Users]
	 *     summary: Создание менеджера склада
	 *     description: Создает пользователя с ролью WAREHOUSE_MANAGER. Доступно для SUPERADMIN и ADMIN.
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
	 *         description: Менеджер склада создан
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Пользователь успешно создан"
	 *                 data:
	 *                   $ref: '#/components/schemas/UserResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async createUser(
		{ body, path }: Request<{}, {}, UserRegisterDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const role = path.includes('admin') ? 'ADMIN' : 'WAREHOUSE_MANAGER';
			const result = await this.usersService.createUser(body, role);
			this.created(res, {
				message: MESSAGES.USER_CREATED,
				data: {
					id: result.id,
					email: result.email,
					name: result.name,
					role: result.role,
					createdAt: result.createdAt,
					updatedAt: result.updatedAt,
				},
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
	 *     description: Аутентифицирует пользователя и возвращает JWT-токен. Доступно для всех ролей.
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
	 *         description: Ошибка валидации данных
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
	 * /users/warehouseManagers:
	 *   get:
	 *     tags: [Users]
	 *     summary: Получение списка менеджеров склада
	 *     description: Возвращает список пользователей с ролью WAREHOUSE_MANAGER с пагинацией. Доступно для SUPERADMIN и ADMIN.
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
	 *         description: Список менеджеров склада
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/WarehouseManagerResponse'
	 *                 meta:
	 *                   type: object
	 *                   properties:
	 *                     total:
	 *                       type: integer
	 *                       example: 15
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *                     totalPages:
	 *                       type: integer
	 *                       example: 2
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации параметров
	 */
	async getAllWarehouseManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.usersService.getAllWarehouseManagers(pagination);
			this.sendPaginatedResponse(res, result.items, result.total, pagination);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /users/warehouseManager/{id}/password:
	 *   patch:
	 *     tags: [Users]
	 *     summary: Обновление пароля менеджера склада
	 *     description: Обновляет пароль пользователя с ролью WAREHOUSE_MANAGER. Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор пользователя.
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/UserUpdatePasswordDto'
	 *     responses:
	 *       200:
	 *         description: Пароль обновлен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Пароль успешно обновлен"
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Пользователь не найден
	 *       422:
	 *         description: Ошибка валидации данных
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
	 * /users/warehouseManager/{id}:
	 *   delete:
	 *     tags: [Users]
	 *     summary: Удаление менеджера склада
	 *     description: Удаляет пользователя с ролью WAREHOUSE_MANAGER. Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор пользователя.
	 *     responses:
	 *       200:
	 *         description: Менеджер склада удален
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Пользователь успешно удален"
	 *       401:
	 *         description: Не авторизован
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
