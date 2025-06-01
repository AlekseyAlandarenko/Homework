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
				path: '/supplier',
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
				path: '/suppliers',
				method: 'get',
				func: this.getAllSuppliers,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(PaginationDto),
				],
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
	 * /users/supplier:
	 *   post:
	 *     tags: [Users]
	 *     summary: Создание поставщика
	 *     description: Создает пользователя с ролью SUPPLIER. Доступно для SUPERADMIN и ADMIN.
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
	 *         description: Поставщик создан
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
			const role = path.includes('admin') ? 'ADMIN' : 'SUPPLIER';
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
	 * /users/suppliers:
	 *   get:
	 *     tags: [Users]
	 *     summary: Получение списка поставщиков
	 *     description: Возвращает список пользователей с ролью SUPPLIER с пагинацией. Доступно для SUPERADMIN и ADMIN.
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
	async getAllSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.usersService.getAllSuppliers(pagination);
			this.sendPaginatedResponse(res, result.items, result.total, pagination);
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
	 *     description: Обновляет пароль пользователя с ролью SUPPLIER. Доступно для SUPERADMIN и ADMIN.
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
	 *     description: Удаляет пользователя с ролью SUPPLIER, если нет активных акций. Доступно для SUPERADMIN и ADMIN.
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
	 *         description: Поставщик удален
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Пользователь успешно удален"
	 *       400:
	 *         description: Поставщик имеет активные акции
	 *       401:
	 *         description: Не авторизован
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
