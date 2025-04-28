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

	async getAllWarehouseManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const warehouseManagers = await this.usersService.getAllWarehouseManagers();
			this.ok(res, { data: warehouseManagers });
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
			const id = Number(req.params.id);
			await this.usersService.updateWarehouseManagerPassword(id, req.body.newPassword);
			this.ok(res, { message: MESSAGES.PASSWORD_UPDATED });
		} catch (err) {
			next(err);
		}
	}

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
