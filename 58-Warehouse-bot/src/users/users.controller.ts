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
import { WarehouseManagerDeleteDto } from './dto/user-delete-warehouse-manager.dto';
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
				path: '/warehouse-manager',
				method: 'post',
				func: this.createUser,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new SetRoleMiddleware(Role.WAREHOUSE_MANAGER),
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
				path: '/warehouse-managers',
				method: 'get',
				func: this.getAllWarehouseManagers,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PaginationDto),
					new ValidateMiddleware(UserFilterDto),
				],
			},
			{
				path: '/warehouse-manager/:id/password',
				method: 'patch',
				func: this.updateWarehouseManagerPassword,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateIdMiddleware(),
					new ValidateMiddleware(UserUpdatePasswordDto),
				],
			},
			{
				path: '/warehouse-manager/:id',
				method: 'delete',
				func: this.deleteWarehouseManager,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateIdMiddleware(),
					new ValidateMiddleware(WarehouseManagerDeleteDto),
				],
			},
			{
				path: '/profile',
				method: 'patch',
				func: this.updateUserProfile,
				middlewares: [new AuthGuard(), new ValidateMiddleware(UserUpdateProfileDto)],
			},
			{
				path: '/profile/addresses',
				method: 'get',
				func: this.getUserAddresses,
				middlewares: [new AuthGuard()],
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
	 * /users/warehouse-manager:
	 *   post:
	 *     summary: Создание начальника склада
	 *     description: Создает нового начальника склада (требуется роль SUPERADMIN или ADMIN).
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
	 *         description: начальника склада успешно создан
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
			const role = req.targetRole!;
			const result = await this.usersService.createUser(req.body, role);
			this.sendCreated(res, MESSAGES.USER_CREATED, {
				id: result.id,
				email: result.email,
				name: result.name,
				role: result.role,
				telegramId: result.telegramId,
				cityId: result.cityId,
				city: result.city,
				categoryIds: result.preferredCategories?.map((c) => c.id) ?? [],
				addresses: result.addresses,
				createdAt: result.createdAt,
				updatedAt: result.updatedAt,
			});
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /users/warehouse-managers:
	 *   get:
	 *     summary: Получение списка начальников склада
	 *     description: Возвращает пагинированный список начальников склада с фильтрацией (требуется роль SUPERADMIN или ADMIN).
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
	 *         name: hasProducts
	 *         schema:
	 *           type: boolean
	 *         description: Фильтр по наличию активных продуктов
	 *       - in: query
	 *         name: hasAddresses
	 *         schema:
	 *           type: boolean
	 *         description: Фильтр по наличию адресов
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
	 *         description: Список начальников склада успешно получен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Начальники склада успешно получены
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
	async getAllWarehouseManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const filters: UserFilterDto = {
				cityId: req.query.cityId ? Number(req.query.cityId) : undefined,
				hasProducts:
					req.query.hasProducts === 'true'
						? true
						: req.query.hasProducts === 'false'
							? false
							: undefined,
				hasAddresses:
					req.query.hasAddresses === 'true'
						? true
						: req.query.hasAddresses === 'false'
							? false
							: undefined,
				categoryIds: req.query.categoryIds as number[] | undefined,
				sortBy: req.query.sortBy as string,
				sortOrder: req.query.sortOrder as string,
			};
			const result = await this.usersService.getAllWarehouseManagers({ filters, pagination });
			this.sendSuccess(res, MESSAGES.WAREHOUSE_MANAGERS_RETRIEVED, {
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
	 * /users/profile/addresses:
	 *   get:
	 *     summary: Получение адресов пользователя
	 *     description: Возвращает список адресов текущего пользователя.
	 *     tags: [Users]
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Адреса успешно получены
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Адреса успешно получены
	 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AddressResponse'
	 *       401:
	 *         description: Неавторизован
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
	async getUserAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const userId = req.user!.id;
			const addresses = await this.usersService.getUserAddresses(userId);
			this.sendSuccess(res, MESSAGES.ADDRESSES_RETRIEVED, addresses);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /users/warehouse-manager/{id}/password:
	 *   patch:
	 *     summary: Обновление пароля начальника склада
	 *     description: Обновляет пароль указанного начальника склада (требуется роль SUPERADMIN или ADMIN).
	 *     tags: [Users]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор начальника склада
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
	async updateWarehouseManagerPassword(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const id = parseInt(req.params.id);
			const { oldPassword, newPassword } = req.body;
			await this.usersService.updateWarehouseManagerPassword(id, newPassword, oldPassword);
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
				city: result.city,
				preferredCategories: result.preferredCategories,
				addresses: result.addresses,
				createdAt: result.createdAt,
				updatedAt: result.updatedAt,
			});
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /users/warehouse-manager/{id}:
	 *   delete:
	 *     summary: Удаление начальника склада
	 *     description: Удаляет начальника склада по ID (требуется роль SUPERADMIN или ADMIN). Если у начальника склада есть активные продукты, необходимо указать нового ответственного.
	 *     tags: [Users]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор начальника склада
	 *     requestBody:
	 *       required: false
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/WarehouseManagerDeleteDto'
	 *     responses:
	 *       200:
	 *         description: Начальник склада успешно удален
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
	 *         description: У начальника склада есть активные продукты, требуется новый ответственный
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async deleteWarehouseManager(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = parseInt(req.params.id);
			const { newResponsibleId } = req.body as WarehouseManagerDeleteDto;
			await this.usersService.deleteWarehouseManager(id, newResponsibleId);
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