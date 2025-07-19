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

	async getUserAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const userId = req.user!.id;
			const addresses = await this.usersService.getUserAddresses(userId);
			this.sendSuccess(res, MESSAGES.ADDRESSES_RETRIEVED, addresses);
		} catch (err) {
			next(err);
		}
	}

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
