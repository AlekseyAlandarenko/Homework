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

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Управление товарами на складе
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

    /**
     * @swagger
     * /products:
     *   post:
     *     tags: [Products]
     *     summary: Создание нового товара
     *     description: Создает новый товар на складе (только для ADMIN и SUPERADMIN)
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
     *         description: Товар успешно создан
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Товар успешно создан
     *                 data:
     *                   $ref: '#/components/schemas/ProductResponse'
     *       400:
     *         description: Неверный формат данных
     *       401:
     *         description: Неавторизован
     *       403:
     *         description: Доступ запрещен
     *       422:
     *         description: Ошибка валидации
     */
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

    /**
     * @swagger
     * /products:
     *   get:
     *     tags: [Products]
     *     summary: Получение списка товаров
     *     description: Возвращает список всех товаров с пагинацией и фильтрацией (только для ADMIN и SUPERADMIN)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Номер страницы
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Количество записей на странице
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         description: Фильтр по категории
     *       - in: query
     *         name: isActive
     *         schema:
     *           type: boolean
     *         description: Фильтр по активности товара
     *       - in: query
     *         name: name
     *         schema:
     *           type: string
     *         description: Поиск по названию товара
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [id, name, price, quantity, createdAt, updatedAt, category, sku, isActive]
     *           default: id
     *         description: Поле для сортировки
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: asc
     *         description: Порядок сортировки
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
     *                       type: number
     *                       example: 100
     *                     page:
     *                       type: number
     *                       example: 1
     *                     limit:
     *                       type: number
     *                       example: 10
     *                     totalPages:
     *                       type: number
     *                       example: 10
     *       401:
     *         description: Неавторизован
     *       403:
     *         description: Доступ запрещен
     */
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { category, isActive, quantity, name, priceMin, priceMax, sortBy = 'id', sortOrder = 'asc', page, limit } = req.query;
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
            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 10;
            const result = await this.productsService.getAllProducts({ filters, sort, page: pageNum, limit: limitNum });
            this.ok(res, {
                data: result.items,
                meta: {
                    total: result.total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(result.total / limitNum),
                },
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /products/my:
     *   get:
     *     tags: [Products]
     *     summary: Получение списка товаров текущего начальника склада
     *     description: Возвращает список товаров, созданных текущим начальника склада
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список товаров начальника склада
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ProductResponse'
     *       401:
     *         description: Неавторизован
     *       403:
     *         description: Доступ запрещен
     */
    async getMyProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const products = await this.productsService.getProductsByManager(req.user?.email);
            this.ok(res, { data: products });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /products/all:
     *   get:
     *     tags: [Products]
     *     summary: Получение списка всех товаров для начальника склада
     *     description: Возвращает список всех товаров с пагинацией и фильтрацией (для WAREHOUSE_MANAGER)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Номер страницы
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Количество записей на странице
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         description: Фильтр по категории
     *       - in: query
     *         name: isActive
     *         schema:
     *           type: boolean
     *         description: Фильтр по активности товара
     *       - in: query
     *         name: name
     *         schema:
     *           type: string
     *         description: Поиск по названию товара
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [id, name, price, quantity, createdAt, updatedAt, category, sku, isActive]
     *           default: id
     *         description: Поле для сортировки
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: asc
     *         description: Порядок сортировки
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
     *                       type: number
     *                       example: 100
     *                     page:
     *                       type: number
     *                       example: 1
     *                     limit:
     *                       type: number
     *                       example: 10
     *                     totalPages:
     *                       type: number
     *                       example: 10
     *       401:
     *         description: Неавторизован
     *       403:
     *         description: Доступ запрещен
     */
    async getAllForManager(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { category, isActive, quantity, name, priceMin, priceMax, sortBy = 'id', sortOrder = 'asc', page, limit } = req.query;
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
            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 10;
            const result = await this.productsService.getAllProducts({ filters, sort, page: pageNum, limit: limitNum });
            this.ok(res, {
                data: result.items,
                meta: {
                    total: result.total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(result.total / limitNum),
                },
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /products/{id}/status:
     *   get:
     *     tags: [Products]
     *     summary: Получение статуса товара
     *     description: Возвращает текущий статус и количество товара
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID товара
     *     responses:
     *       200:
     *         description: Статус товара
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: number
     *                     name:
     *                       type: string
     *                     quantity:
     *                       type: number
     *                     isActive:
     *                       type: boolean
     *                     message:
     *                       type: string
     *       404:
     *         description: Товар не найден
     */
    async getProductStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const status = await this.productsService.getProductStatus(id);
            this.ok(res, { data: status });
        } catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /products/{id}:
     *   patch:
     *     tags: [Products]
     *     summary: Обновление информации о товаре
     *     description: Обновляет информацию о товаре (только для ADMIN и SUPERADMIN)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID товара
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProductUpdateDto'
     *     responses:
     *       200:
     *         description: Товар успешно обновлен
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Товар успешно обновлен
     *                 data:
     *                   $ref: '#/components/schemas/ProductResponse'
     *       400:
     *         description: Неверный формат данных
     *       401:
     *         description: Неавторизован
     *       403:
     *         description: Доступ запрещен
     *       404:
     *         description: Товар не найден
     *       422:
     *         description: Ошибка валидации
     */
    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const product = await this.productsService.updateProduct(id, req.body);
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
     *     summary: Добавление количества товара
     *     description: Увеличивает количество товара на складе (только для WAREHOUSE_MANAGER)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID товара
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProductQuantityDto'
     *     responses:
     *       200:
     *         description: Количество товара успешно обновлено
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Количество товара обновлено
     *                 data:
     *                   $ref: '#/components/schemas/ProductResponse'
     *       400:
     *         description: Неверный формат данных
     *       401:
     *         description: Неавторизован
     *       403:
     *         description: Доступ запрещен
     *       404:
     *         description: Товар не найден
     *       422:
     *         description: Ошибка валидации
     */
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

    /**
     * @swagger
     * /products/{id}/purchase:
     *   post:
     *     tags: [Products]
     *     summary: Покупка товара
     *     description: Уменьшает количество товара на складе (только для ADMIN и SUPERADMIN)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID товара
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProductQuantityDto'
     *     responses:
     *       200:
     *         description: Покупка успешно выполнена
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Покупка успешно выполнена
     *                 data:
     *                   $ref: '#/components/schemas/ProductResponse'
     *       400:
     *         description: Неверный формат данных
     *       401:
     *         description: Неавторизован
     *       403:
     *         description: Доступ запрещен
     *       404:
     *         description: Товар не найден
     *       422:
     *         description: Ошибка валидации или недостаточно товара
     */
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

    /**
     * @swagger
     * /products/{id}:
     *   delete:
     *     tags: [Products]
     *     summary: Удаление товара
     *     description: Удаляет товар с склада (только для ADMIN и SUPERADMIN)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID товара
     *     responses:
     *       200:
     *         description: Товар успешно удален
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Товар успешно удален
     *       401:
     *         description: Неавторизован
     *       403:
     *         description: Доступ запрещен
     *       404:
     *         description: Товар не найден
     */
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