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
import { ValidateMiddleware } from '../common/validate.middleware';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { IProductsService } from './products.service.interface';
import { MESSAGES } from '../common/messages';

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Управление товарами и складом
 */
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
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(ProductCreateDto),
				],
			},
			{
				path: '/',
				method: 'get',
				func: this.getAllProducts,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
					new ValidateMiddleware(PaginationDto),
				],
			},
			{
				path: '/my',
				method: 'get',
				func: this.getMyProducts,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['WAREHOUSE_MANAGER']),
					new ValidateMiddleware(PaginationDto),
				],
			},
			{
				path: '/stock',
				method: 'get',
				func: this.getStock,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
					new ValidateMiddleware(PaginationDto),
				],
			},
						{
				path: '/:id',
				method: 'get',
				func: this.getProductById,
				middlewares: [
					new AuthGuard(), 
					new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'])
				],
			},
			{
				path: '/:id',
				method: 'patch',
				func: this.updateProduct,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN']),
					new ValidateMiddleware(ProductUpdateDto),
				],
			},
			{
				path: '/:id/quantity',
				method: 'patch',
				func: this.updateProductQuantity,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
					new ValidateMiddleware(ProductPurchaseOrAddQuantityDto),
				],
			},
			{
				path: '/:id/purchase',
				method: 'post',
				func: this.purchaseProduct,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
					new ValidateMiddleware(ProductPurchaseOrAddQuantityDto),
				],
			},
			{
				path: '/:id',
				method: 'delete',
				func: this.deleteProduct,
				middlewares: [
					new AuthGuard(), 
					new RoleGuard(['SUPERADMIN', 'ADMIN'])
				],
			},
		]);
	}

	/**
	 * @swagger
	 * /products:
	 *   post:
	 *     tags: [Products]
	 *     summary: Создание товара
	 *     description: Создает новый товар. Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ProductCreateDto'
	 *     responses:
	 *       201:
	 *         description: Товар создан
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Товар успешно создан"
	 *                 data:
	 *                   $ref: '#/components/schemas/ProductResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
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

	/**
	 * @swagger
	 * /products:
	 *   get:
	 *     tags: [Products]
	 *     summary: Получение списка товаров
	 *     description: Возвращает список товаров с фильтрацией, сортировкой и пагинацией. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: name
	 *         schema:
	 *           type: string
	 *         description: Фильтр по названию (частично, без учета регистра).
	 *       - in: query
	 *         name: minPrice
	 *         schema:
	 *           type: number
	 *         description: Минимальная цена.
	 *       - in: query
	 *         name: maxPrice
	 *         schema:
	 *           type: number
	 *         description: Максимальная цена.
	 *       - in: query
	 *         name: category
	 *         schema:
	 *           type: string
	 *         description: Фильтр по категории.
	 *       - in: query
	 *         name: isActive
	 *         schema:
	 *           type: boolean
	 *         description: Фильтр по статусу активности.
	 *       - in: query
	 *         name: available
	 *         schema:
	 *           type: boolean
	 *         description: Только товары с количеством > 0.
	 *       - in: query
	 *         name: sortBy
	 *         schema:
	 *           type: string
	 *           enum: [name, price, quantity, createdAt, updatedAt]
	 *         description: Поле сортировки.
	 *       - in: query
	 *         name: sortOrder
	 *         schema:
	 *           type: string
	 *           enum: [asc, desc]
	 *           default: asc
	 *         description: Порядок сортировки.
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
	 *         description: Список товаров
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/ProductResponse'
	 *                 meta:
	 *                   type: object
	 *                   properties:
	 *                     total:
	 *                       type: integer
	 *                       example: 50
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *                     totalPages:
	 *                       type: integer
	 *                       example: 5
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации параметров
	 */
	async getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const { name, minPrice, maxPrice, category, isActive, available, sortBy, sortOrder } =
				req.query as any;
			const result = await this.productsService.getAllProducts({
				filters: {
					name,
					minPrice: minPrice ? Number(minPrice) : undefined,
					maxPrice: maxPrice ? Number(maxPrice) : undefined,
					category,
					isActive: isActive ? isActive === 'true' : undefined,
					available: available ? available === 'true' : undefined,
				},
				orderBy: { sortBy, sortOrder },
				pagination,
			});
			this.sendPaginatedResponse(res, result.items, result.total, pagination);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /products/my:
	 *   get:
	 *     tags: [Products]
	 *     summary: Получение товаров менеджера склада
	 *     description: Возвращает список товаров, созданных текущим менеджером склада, с пагинацией. Доступно для WAREHOUSE_MANAGER.
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
	 *         description: Список товаров
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/ProductResponse'
	 *                 meta:
	 *                   type: object
	 *                   properties:
	 *                     total:
	 *                       type: integer
	 *                       example: 5
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *                     totalPages:
	 *                       type: integer
	 *                       example: 1
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации параметров
	 */
	async getMyProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.productsService.getProductsByCreator(req.user?.email, pagination);
			this.sendPaginatedResponse(res, result.items, result.total, pagination);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /products/stock:
	 *   get:
	 *     tags: [Products]
	 *     summary: Получение остатков товаров
	 *     description: Возвращает остатки активных товаров (id, sku, quantity) с пагинацией. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
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
	 *         description: Список остатков
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     type: object
	 *                     properties:
	 *                       id:
	 *                         type: integer
	 *                         example: 1
	 *                       sku:
	 *                         type: string
	 *                         example: "NB-HP-ELITE-001"
	 *                       quantity:
	 *                         type: integer
	 *                         example: 10
	 *                 meta:
	 *                   type: object
	 *                   properties:
	 *                     total:
	 *                       type: integer
	 *                       example: 50
	 *                     page:
	 *                       type: integer
	 *                       example: 1
	 *                     limit:
	 *                       type: integer
	 *                       example: 10
	 *                     totalPages:
	 *                       type: integer
	 *                       example: 5
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       422:
	 *         description: Ошибка валидации параметров
	 */
	async getStock(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const pagination = this.getPagination(req);
			const result = await this.productsService.getStock(pagination);
			this.sendPaginatedResponse(res, result.items, result.total, pagination);
		} catch (err) {
			next(err);
		}
	}

		/**
	 * @swagger
	 * /products/{id}:
	 *   get:
	 *     tags: [Products]
	 *     summary: Получение товара по ID
	 *     description: Возвращает данные товара по его идентификатору. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор товара.
	 *     responses:
	 *       200:
	 *         description: Данные товара
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   $ref: '#/components/schemas/ProductResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Товар не найден
	 */
	async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = parseInt(req.params.id, 10);
			const userId = req.user?.id || 0;
			const role = req.user?.role || '';
			const product = await this.productsService.getProductById(id, userId, role);
			this.ok(res, { data: product });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /products/{id}:
	 *   patch:
	 *     tags: [Products]
	 *     summary: Обновление товара
	 *     description: Обновляет данные товара. Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор товара.
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ProductUpdateDto'
	 *     responses:
	 *       200:
	 *         description: Товар обновлен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Товар успешно обновлен"
	 *                 data:
	 *                   $ref: '#/components/schemas/ProductResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Товар не найден
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const product = await this.productsService.updateProduct(id, req.body, req.user?.email);
			this.ok(res, { message: MESSAGES.PRODUCT_UPDATED, data: product });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /products/{id}/quantity:
	 *   patch:
	 *     tags: [Products]
	 *     summary: Обновление количества товара
	 *     description: Увеличивает количество товара на складе. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор товара.
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ProductPurchaseOrAddQuantityDto'
	 *     responses:
	 *       200:
	 *         description: Количество обновлено
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Количество товара обновлено"
	 *                 data:
	 *                   $ref: '#/components/schemas/ProductResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Товар не найден
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async updateProductQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const product = await this.productsService.updateProductQuantity(
				id,
				req.body,
				req.user?.email,
			);
			this.ok(res, { message: MESSAGES.PRODUCT_QUANTITY_UPDATED, data: product });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /products/{id}/purchase:
	 *   post:
	 *     tags: [Products]
	 *     summary: Покупка товара
	 *     description: Уменьшает количество товара на складе. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор товара.
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ProductPurchaseOrAddQuantityDto'
	 *     responses:
	 *       200:
	 *         description: Покупка завершена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Покупка товара завершена"
	 *                 data:
	 *                   $ref: '#/components/schemas/ProductResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Товар не найден
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async purchaseProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			const product = await this.productsService.purchaseProduct(id, req.body, req.user?.email);
			this.ok(res, { message: MESSAGES.PRODUCT_PURCHASE_COMPLETED, data: product });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /products/{id}:
	 *   delete:
	 *     tags: [Products]
	 *     summary: Удаление товара
	 *     description: Выполняет мягкое удаление товара. Доступно для SUPERADMIN и ADMIN.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор товара.
	 *     responses:
	 *       200:
	 *         description: Товар удален
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Товар успешно удален"
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Товар не найден
	 */
	async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const id = Number(req.params.id);
			await this.productsService.deleteProduct(id, req.user?.email);
			this.ok(res, { message: MESSAGES.PRODUCT_DELETED });
		} catch (err) {
			next(err);
		}
	}
}
