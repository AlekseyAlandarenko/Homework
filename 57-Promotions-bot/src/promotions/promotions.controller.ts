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
import { PaginationDto } from '../common/dto/pagination.dto';
import { PromotionsFilterDto } from './dto/promotion-filter.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { IPromotionsService } from './promotions.service.interface';
import { MESSAGES } from '../common/messages';
import { ADMIN_ROLES, FULL_ACCESS_ROLES } from '../common/constants';
import { ValidateIdMiddleware } from '../common/validate-id.middleware';
import { Role } from '../common/enums/role.enum';
import { PromotionStatus } from '../common/enums/promotion-status.enum';
import { NotificationService } from '../notification/notification.service';

@injectable()
export class PromotionsController extends BaseController implements IPromotionsController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.PromotionsService) private promotionsService: IPromotionsService,
		@inject(TYPES.NotificationService) private notificationService: NotificationService,
	) {
		super(loggerService);
		this.bindRoutes([
			{
				path: '/',
				method: 'post',
				func: this.createPromotion,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PromotionCreateOrProposeDto),
				],
			},
			{
				path: '/propose',
				method: 'post',
				func: this.createPromotion,
				middlewares: [
					new AuthGuard(),
					new RoleGuard([Role.SUPPLIER]),
					new ValidateMiddleware(PromotionCreateOrProposeDto),
				],
			},
			{
				path: '/',
				method: 'get',
				func: this.getAllPromotions,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PaginationDto),
					new ValidateMiddleware(PromotionsFilterDto),
				],
			},
			{
				path: '/my',
				method: 'get',
				func: this.getMyPromotions,
				middlewares: [
					new AuthGuard(),
					new RoleGuard([Role.SUPPLIER]),
					new ValidateMiddleware(PaginationDto),
				],
			},
			{
				path: '/:id',
				method: 'get',
				func: this.getPromotionById,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id',
				method: 'patch',
				func: this.updatePromotion,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PromotionUpdateDto),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id/status',
				method: 'patch',
				func: this.updatePromotionStatus,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(PromotionStatusDto),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id',
				method: 'delete',
				func: this.deletePromotion,
				middlewares: [new AuthGuard(), new RoleGuard(ADMIN_ROLES), new ValidateIdMiddleware()],
			},
		]);
	}

	private sendSuccess<T>(res: Response, message: string, data: T): void {
		this.ok(res, { message, data });
	}

	private sendCreated<T>(res: Response, message: string, data: T): void {
		this.created(res, { message, data });
	}

	async createPromotion(
		{ body, path, user }: Request<{}, {}, PromotionCreateOrProposeDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const status = path === '/propose' ? PromotionStatus.PENDING : PromotionStatus.APPROVED;
			const supplierId = path === '/propose' ? user!.id : body.supplierId || user!.id;
			const promotion = await this.promotionsService.createPromotion({
				...body,
				status,
				supplierId,
			});
			if (promotion.status === PromotionStatus.APPROVED && !promotion.publicationDate) {
				await this.notificationService.notifyUsersAboutNewPromotion(promotion.id);
			}
			this.sendCreated(res, MESSAGES.PROMOTION_CREATED, promotion);
		} catch (err) {
			next(err);
		}
	}

	async getAllPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const filters: PromotionsFilterDto = {
				status: req.query.status as PromotionStatus,
				active:
					req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
				cityId: req.query.cityId ? Number(req.query.cityId) : undefined,
				categoryIds: req.query.categoryIds as number[] | undefined,
				sortBy: req.query.sortBy as string,
				sortOrder: req.query.sortOrder as string,
			};
			const result = await this.promotionsService.getAllPromotions({ filters, pagination });
			this.sendSuccess(res, MESSAGES.PROMOTIONS_RETRIEVED, {
				items: result.items,
				total: result.total,
				page: pagination.page,
				limit: pagination.limit,
			});
		} catch (err) {
			next(err);
		}
	}

	async getMyPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.promotionsService.getPromotionsBySupplier(req.user!.id, pagination);
			this.sendSuccess(res, MESSAGES.PROMOTIONS_RETRIEVED, {
				items: result.items,
				total: result.total,
				page: pagination.page,
				limit: pagination.limit,
			});
		} catch (err) {
			next(err);
		}
	}

	async getPromotionById(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const userId = req.user?.id;
			const userRole = req.user?.role as Role;
			const promotion = await this.promotionsService.getPromotionById(id, userId, userRole);
			this.sendSuccess(res, MESSAGES.PROMOTIONS_RETRIEVED, promotion);
		} catch (err) {
			next(err);
		}
	}

	async updatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const promotion = await this.promotionsService.updatePromotion(id, req.body);
			this.sendSuccess(res, MESSAGES.PROMOTION_UPDATED, promotion);
		} catch (err) {
			next(err);
		}
	}

	async updatePromotionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const promotion = await this.promotionsService.updatePromotionStatus(id, req.body.status);
			if (promotion.status === PromotionStatus.APPROVED && !promotion.publicationDate) {
				await this.notificationService.notifyUsersAboutNewPromotion(promotion.id);
			}
			this.sendSuccess(res, MESSAGES.PROMOTION_UPDATED, promotion);
		} catch (err) {
			next(err);
		}
	}

	async deletePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.promotionsService.deletePromotion(id);
			this.sendSuccess(res, MESSAGES.PROMOTION_DELETED, { id });
		} catch (err) {
			next(err);
		}
	}
}
