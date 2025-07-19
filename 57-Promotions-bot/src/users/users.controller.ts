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

	async deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = parseInt(req.params.id);
			await this.usersService.deleteSupplier(id);
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
