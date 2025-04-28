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
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { IProductsService } from './products.service.interface';
import { MESSAGES } from '../common/messages';
import { ProductModel } from '@prisma/client';

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
                func: this.create,
                middlewares: [
                    new AuthGuard(),
                    new RoleGuard(['SUPERADMIN', 'ADMIN']),
                    new ValidateMiddleware(ProductCreateDto),
                ],
            },
            {
                path: '/',
                method: 'get',
                func: this.getAll,
                middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN'])],
            },
            {
                path: '/my',
                method: 'get',
                func: this.getMyProducts,
                middlewares: [new AuthGuard(), new RoleGuard(['WAREHOUSE_MANAGER'])],
            },
            {
                path: '/all',
                method: 'get',
                func: this.getAllForManager,
                middlewares: [new AuthGuard(), new RoleGuard(['WAREHOUSE_MANAGER'])],
            },
            {
                path: '/:id/status',
                method: 'get',
                func: this.getProductStatus,
                middlewares: [],
            },
            {
                path: '/:id',
                method: 'patch',
                func: this.update,
                middlewares: [
                    new AuthGuard(),
                    new RoleGuard(['SUPERADMIN', 'ADMIN']),
                    new ValidateMiddleware(ProductUpdateDto),
                ],
            },
            {
                path: '/:id/quantity',
                method: 'patch',
                func: this.addQuantity,
                middlewares: [
                    new AuthGuard(),
                    new RoleGuard(['WAREHOUSE_MANAGER']),
                    new ValidateMiddleware(ProductPurchaseOrAddQuantityDto),
                ],
            },
            {
                path: '/:id/purchase',
                method: 'post',
                func: this.purchase,
                middlewares: [
                    new AuthGuard(),
                    new RoleGuard(['SUPERADMIN', 'ADMIN']),
                    new ValidateMiddleware(ProductPurchaseOrAddQuantityDto),
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

    async create(
        req: Request<{}, {}, ProductCreateDto>,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const product = await this.productsService.createProduct({
                ...req.body,
                userEmail: req.user?.email,
            });
            this.created(res, { message: MESSAGES.PRODUCT_CREATED, data: product });
        } catch (err) {
            next(err);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { category, isActive, quantity, name, priceMin, priceMax, sortBy = 'id', sortOrder = 'asc' } = req.query;
            const filters = {
                category: typeof category === 'string' ? category : undefined,
                isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
                quantity: typeof quantity === 'string' ? Number(quantity) : undefined,
                name: typeof name === 'string' ? name : undefined,
                priceMin: typeof priceMin === 'string' ? Number(priceMin) : undefined,
                priceMax: typeof priceMax === 'string' ? Number(priceMax) : undefined,
            };
            const sort = {
                sortBy: typeof sortBy === 'string' ? (sortBy as keyof ProductModel) : 'id',
                sortOrder:
                    typeof sortOrder === 'string' && ['asc', 'desc'].includes(sortOrder)
                        ? (sortOrder as 'asc' | 'desc')
                        : 'asc',
            };
            const products = await this.productsService.getAllProducts({ filters, sort });
            this.ok(res, { data: products });
        } catch (err) {
            next(err);
        }
    }

    async getMyProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const products = await this.productsService.getProductsByManager(req.user?.email);
            this.ok(res, { data: products });
        } catch (err) {
            next(err);
        }
    }

    async getAllForManager(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { category, isActive, quantity, name, priceMin, priceMax, sortBy = 'id', sortOrder = 'asc' } = req.query;
            const filters = {
                category: typeof category === 'string' ? category : undefined,
                isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
                quantity: typeof quantity === 'string' ? Number(quantity) : undefined,
                name: typeof name === 'string' ? name : undefined,
                priceMin: typeof priceMin === 'string' ? Number(priceMin) : undefined,
                priceMax: typeof priceMax === 'string' ? Number(priceMax) : undefined,
            };
            const sort = {
                sortBy: typeof sortBy === 'string' ? (sortBy as keyof ProductModel) : 'id',
                sortOrder:
                    typeof sortOrder === 'string' && ['asc', 'desc'].includes(sortOrder)
                        ? (sortOrder as 'asc' | 'desc')
                        : 'asc',
            };
            const products = await this.productsService.getAllProducts({ filters, sort });
            this.ok(res, { data: products });
        } catch (err) {
            next(err);
        }
    }

    async getProductStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const status = await this.productsService.getProductStatus(id);
            this.ok(res, { data: status });
        } catch (err) {
            next(err);
        }
    }

	async update(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const product = await this.productsService.updateProduct(id, req.body);
			this.ok(res, { message: MESSAGES.PRODUCT_UPDATED, data: product });
		} catch (err) {
			next(err);
		}
	}

    async addQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const product = await this.productsService.addProductQuantity(
                id,
                req.body.quantity,
                req.user?.email,
            );
            this.ok(res, { message: MESSAGES.PRODUCT_QUANTITY_UPDATED, data: product });
        } catch (err) {
            next(err);
        }
    }

    async purchase(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const product = await this.productsService.purchaseProduct(
                id,
                req.body.quantity,
                req.user?.email,
            );
            this.ok(res, { message: MESSAGES.PRODUCT_PURCHASE_COMPLETED, data: product });
        } catch (err) {
            next(err);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await this.productsService.deleteProduct(id);
            this.ok(res, { message: MESSAGES.PRODUCT_DELETED });
        } catch (err) {
            next(err);
        }
    }
}