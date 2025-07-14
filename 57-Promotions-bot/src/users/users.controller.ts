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
import { UserUpdateProfileDto } from './dto/user-update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { IUsersService } from './users.service.interface';
import { MESSAGES } from '../common/messages';
import { ValidateIdMiddleware } from '../common/validate-id.middleware';
import { ADMIN_ROLES } from '../common/constants';
import { SetRoleMiddleware } from '../common/set-role.middleware';
import { Role } from '../common/enums/role.enum';

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
					new RoleGuard([Role.SUPERADMIN]),
					new SetRoleMiddleware(Role.ADMIN),
					new ValidateMiddleware(UserRegisterDto),
				],
			},
			{
				path: '/supplier',
				method: 'post',
				func: this.createUser,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new SetRoleMiddleware(Role.SUPPLIER),
					new ValidateMiddleware(UserRegisterDto),
				],
			},
			{
				path: '/suppliers',
				method: 'get',
				func: this.getAllSuppliers,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PaginationDto),
					new ValidateMiddleware(UserFilterDto),
				],
			},
			{
				path: '/supplier/:id/password',
				method: 'patch',
				func: this.updateSupplierPassword,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateIdMiddleware(),
					new ValidateMiddleware(UserUpdatePasswordDto),
				],
			},
			{
				path: '/profile',
				method: 'patch',
				func: this.updateUserProfile,
				middlewares: [new AuthGuard(), new ValidateMiddleware(UserUpdateProfileDto)],
			},
			{
				path: '/supplier/:id',
				method: 'delete',
				func: this.deleteSupplier,
				middlewares: [new AuthGuard(), new RoleGuard(ADMIN_ROLES), new ValidateIdMiddleware()],
			},
			{
				path: '/login',
				method: 'post',
				func: this.login,
				middlewares: [new ValidateMiddleware(UserLoginDto)],
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
	 * /users/admin:
	 *   post:
	 *     summary: Создание администратора
	 *     description: Создает нового администратора (требуется роль SUPERADMIN).
	 *     tags: [Users]
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
	 *                   $ref: '#/components/schemas/UserResponse'
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Неавторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Недостаточно прав
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       409:
	 *         description: Email уже существует
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	/**
	 * @swagger
	 * /users/supplier:
	 *   post:
	 *     summary: Создание поставщика
	 *     description: Создает нового поставщика (требуется роль SUPERADMIN или ADMIN).
	 *     tags: [Users]
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
	 *         description: Менеджер склада успешно создан
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Пользователь успешно создан
	 *                 data:
	 *                   $ref: '#/components/schemas/UserResponse'
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Неавторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Недостаточно прав
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       409:
	 *         description: Email уже существует
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async createUser(
		req: Request<{}, {}, UserRegisterDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const role = req.targetRole;
			const result = await this.usersService.createUser(req.body, role);
			this.sendCreated(res, MESSAGES.USER_CREATED, {
				id: result.id,
				email: result.email,
				name: result.name,
				role: result.role,
				telegramId: result.telegramId,
				cityId: result.cityId,
				categoryIds: result.preferredCategories?.map((c) => c.id) ?? [],
				createdAt: result.createdAt,
				updatedAt: result.updatedAt,
			});
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /users/suppliers:
	 *   get:
	 *     summary: Получение списка поставщиков
	 *     description: Возвращает пагинированный список поставщиков с фильтрацией (требуется роль SUPERADMIN или ADMIN).
	 *     tags: [Users]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: page
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 1
	 *         description: Номер страницы
	 *       - in: query
	 *         name: limit
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 10
	 *         description: Количество элементов на странице
	 *       - in: query
	 *         name: active
	 *         schema:
	 *           type: boolean
	 *         description: Фильтр по активности поставщика
	 *       - in: query
	 *         name: cityId
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор города
	 *       - in: query
	 *         name: categoryIds
	 *         schema:
	 *           type: array
	 *           items:
	 *             type: integer
	 *         description: Идентификаторы категорий
	 *       - in: query
	 *         name: sortBy
	 *         schema:
	 *           type: string
	 *           enum: [createdAt, email, name]
	 *         description: Поле для сортировки
	 *       - in: query
	 *         name: sortOrder
	 *         schema:
	 *           type: string
	 *           enum: [asc, desc]
	 *         description: Порядок сортировки
	 *     responses:
	 *       200:
	 *         description: Список поставщиков успешно получен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Поставщики успешно получены
	 *                 data:
	 *                   $ref: '#/components/schemas/PaginatedUsersResponse'
	 *       401:
	 *         description: Неавторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Недостаточно прав
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async getAllSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const filters: UserFilterDto = {
				cityId: req.query.cityId ? Number(req.query.cityId) : undefined,
				active:
					req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
				categoryIds: req.query.categoryIds as number[] | undefined,
				sortBy: req.query.sortBy as string,
				sortOrder: req.query.sortOrder as string,
			};
			const result = await this.usersService.getAllSuppliers({ filters, pagination });
			this.sendSuccess(res, MESSAGES.SUPPLIERS_RETRIEVED, {
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
	 * /users/supplier/{id}/password:
	 *   patch:
	 *     summary: Обновление пароля поставщика
	 *     description: Обновляет пароль указанного поставщика (требуется роль SUPERADMIN или ADMIN).
	 *     tags: [Users]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор поставщика
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
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     id:
	 *                       type: integer
	 *                       example: 1
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Неавторизован или неверный текущий пароль
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Недостаточно прав
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       404:
	 *         description: Пользователь не найден
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async updateSupplierPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = parseInt(req.params.id);
			const { oldPassword, newPassword } = req.body;
			await this.usersService.updateSupplierPassword(id, newPassword, oldPassword);
			this.sendSuccess(res, MESSAGES.PASSWORD_UPDATED, { id });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /users/profile:
	 *   patch:
	 *     summary: Обновление профиля пользователя
	 *     description: Обновляет профиль текущего пользователя (доступно для всех ролей).
	 *     tags: [Users]
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/UserUpdateProfileDto'
	 *     responses:
	 *       200:
	 *         description: Профиль успешно обновлен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Профиль успешно обновлен
	 *                 data:
	 *                   $ref: '#/components/schemas/UserResponse'
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Неавторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Недостаточно прав
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       404:
	 *         description: Пользователь не найден
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async updateUserProfile(
		req: Request<{}, {}, UserUpdateProfileDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user!.id;
			const result = await this.usersService.updateUserProfile(userId, req.body, {
				id: req.user!.id,
				role: req.user!.role,
			});
			this.sendSuccess(res, MESSAGES.PROFILE_UPDATED, {
				id: result.id,
				email: result.email,
				name: result.name,
				role: result.role,
				telegramId: result.telegramId,
				cityId: result.cityId,
				categoryIds: result.preferredCategories?.map((c) => c.id) || [],
				createdAt: result.createdAt,
				updatedAt: result.updatedAt,
			});
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /users/supplier/{id}:
	 *   delete:
	 *     summary: Удаление поставщика (мягкое удаление)
	 *     description: Удаляет поставщика по ID (требуется роль SUPERADMIN или ADMIN).
	 *     tags: [Users]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор поставщика
	 *     responses:
	 *       200:
	 *         description: Менеджер склада успешно удален
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Пользователь успешно удален
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     id:
	 *                       type: integer
	 *                       example: 1
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Неавторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Недостаточно прав
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       404:
	 *         description: Пользователь не найден
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       422:
	 *         description: У менеджера есть активные продукты, требуется новый ответственный
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = parseInt(req.params.id);
			await this.usersService.deleteSupplier(id);
			this.sendSuccess(res, MESSAGES.USER_DELETED, { id });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /users/login:
	 *   post:
	 *     summary: Аутентификация пользователя
	 *     description: Аутентифицирует пользователя и возвращает JWT-токен.
	 *     tags: [Users]
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
	 *                 message:
	 *                   type: string
	 *                   example: Аутентификация успешна
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     jwt:
	 *                       type: string
	 *                       description: JWT-токен для аутентификации
	 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Неверные учетные данные
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async login(
		req: Request<{}, {}, UserLoginDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const jwt = await this.usersService.login(req.body);
			this.sendSuccess(res, MESSAGES.AUTHENTICATION_SUCCESS, { jwt });
		} catch (err) {
			next(err);
		}
	}
}
