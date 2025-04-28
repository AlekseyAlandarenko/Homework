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

	async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { status, sortBy, sortOrder, active } = req.query;

			const filters = {
				status: typeof status === 'string' ? status : undefined,
				active: typeof active === 'string' ? active : undefined,
			};
			const orderBy = {
				sortBy: typeof sortBy === 'string' ? sortBy : undefined,
				sortOrder: typeof sortOrder === 'string' ? sortOrder : undefined,
			};

			const promotions = await this.promotionsService.getAllPromotions({
				filters,
				orderBy,
			});
			this.ok(res, { data: promotions });
		} catch (err) {
			next(err);
		}
	}

	async getMyPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const promotions = await this.promotionsService.getPromotionsBySupplier(req.user?.email);
			this.ok(res, { data: promotions });
		} catch (err) {
			next(err);
		}
	}

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

	async update(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const promotion = await this.promotionsService.updatePromotion(id, req.body);
			this.ok(res, { message: MESSAGES.PROMOTION_UPDATED, data: promotion });
		} catch (err) {
			next(err);
		}
	}

	async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const promotion = await this.promotionsService.updatePromotionStatus(id, req.body.status);
			this.ok(res, { message: MESSAGES.PROMOTION_UPDATED, data: promotion });
		} catch (err) {
			next(err);
		}
	}

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
