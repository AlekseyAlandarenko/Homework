import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { ILogger } from '../logger/logger.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import 'reflect-metadata';
import { IProductsController } from './products.controller.interface';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { ProductPurchaseOrAddQuantityDto } from './dto/product-purchase-or-add-quantity.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { ValidateIdMiddleware } from '../common/validate-id.middleware';
import { IProductsService } from './products.service.interface';
import { MESSAGES } from '../common/messages';
import { ADMIN_ROLES, FULL_ACCESS_ROLES } from '../common/constants';
import { Role } from '../common/enums/role.enum';
import { ProductStatus } from '../common/enums/product-status.enum';

@injectable()
export class ProductsController extends BaseController implements IProductsController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.ProductsService) private productsService: IProductsService,
	) {
		super(loggerService);
		this.bindRoutes([
			{
				path: '/',
				method: 'post',
				func: this.createProduct,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(ProductCreateDto),
				],
			},
			{
				path: '/propose',
				method: 'post',
				func: this.createProduct,
				middlewares: [
					new AuthGuard(),
					new RoleGuard([Role.WAREHOUSE_MANAGER]),
					new ValidateMiddleware(ProductCreateDto),
				],
			},
			{
				path: '/',
				method: 'get',
				func: this.getAllProducts,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateMiddleware(PaginationDto),
					new ValidateMiddleware(ProductFilterDto),
				],
			},
			{
				path: '/my',
				method: 'get',
				func: this.getMyProducts,
				middlewares: [
					new AuthGuard(),
					new RoleGuard([Role.WAREHOUSE_MANAGER]),
					new ValidateMiddleware(PaginationDto),
				],
			},
			{
				path: '/stock',
				method: 'get',
				func: this.getStockProducts,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateMiddleware(PaginationDto),
				],
			},
			{
				path: '/:id',
				method: 'get',
				func: this.getProductById,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id',
				method: 'patch',
				func: this.updateProduct,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(ADMIN_ROLES),
					new ValidateMiddleware(ProductUpdateDto),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id/quantity',
				method: 'patch',
				func: this.updateProductQuantity,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateMiddleware(ProductPurchaseOrAddQuantityDto),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id/purchase',
				method: 'post',
				func: this.purchaseProduct,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateMiddleware(ProductPurchaseOrAddQuantityDto),
					new ValidateIdMiddleware(),
				],
			},
			{
				path: '/:id',
				method: 'delete',
				func: this.deleteProduct,
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

	async createProduct(
		{ body, path, user }: Request<{}, {}, ProductCreateDto & { createdById?: number }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const status = path === '/propose' ? ProductStatus.OUT_OF_STOCK : ProductStatus.AVAILABLE;
			const product = await this.productsService.createProduct({
				...body,
				userId: user?.id,
				status,
			});
			this.sendCreated(res, MESSAGES.PRODUCT_CREATED, product);
		} catch (err) {
			next(err);
		}
	}

	async getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const filters: ProductFilterDto = {
				status: req.query.status as ProductStatus,
				cityId: req.query.cityId ? Number(req.query.cityId) : undefined,
				categoryIds: req.query.categoryIds as number[] | undefined,
				sortBy: req.query.sortBy as string,
				sortOrder: req.query.sortOrder as string,
			};
			const result = await this.productsService.getAllProducts({ filters, pagination });
			this.sendSuccess(res, MESSAGES.PRODUCTS_RETRIEVED, {
				items: result.items,
				total: result.total,
				page: pagination.page,
				limit: pagination.limit,
			});
		} catch (err) {
			next(err);
		}
	}

	async getMyProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.productsService.getProductsByCreator(req.user!.id, pagination);
			this.sendSuccess(res, MESSAGES.PRODUCTS_RETRIEVED, {
				items: result.items,
				total: result.total,
				page: pagination.page,
				limit: pagination.limit,
			});
		} catch (err) {
			next(err);
		}
	}

	async getStockProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.productsService.getStockProducts(pagination);
			this.sendSuccess(res, MESSAGES.PRODUCT_STOCK_RETRIEVED, {
				items: result.items,
				total: result.total,
				page: pagination.page,
				limit: pagination.limit,
			});
		} catch (err) {
			next(err);
		}
	}

	async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const product = await this.productsService.getProductById(id, req.user?.id, req.user?.role);
			this.sendSuccess(res, MESSAGES.PRODUCT_RETRIEVED, product);
		} catch (err) {
			next(err);
		}
	}

	async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const product = await this.productsService.updateProduct(id, req.body, req.user?.id);
			this.sendSuccess(res, MESSAGES.PRODUCT_UPDATED, product);
		} catch (err) {
			next(err);
		}
	}

	async updateProductQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const product = await this.productsService.updateProductQuantity(id, req.body, req.user?.id);
			this.sendSuccess(res, MESSAGES.PRODUCT_QUANTITY_UPDATED, product);
		} catch (err) {
			next(err);
		}
	}

	async purchaseProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const product = await this.productsService.purchaseProduct(id, req.body, req.user?.id);
			this.sendSuccess(res, MESSAGES.PRODUCT_PURCHASE_COMPLETED, product);
		} catch (err) {
			next(err);
		}
	}

	async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.productsService.deleteProduct(id, req.user?.id);
			this.sendSuccess(res, MESSAGES.PRODUCT_DELETED, { id });
		} catch (err) {
			next(err);
		}
	}
}
