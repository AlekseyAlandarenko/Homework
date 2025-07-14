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

    /**
     * @swagger
     * /products:
     *   post:
     *     summary: Создание товара
     *     description: Создает новый товар (требуется роль ADMIN или SUPERADMIN).
     *     tags: [Products]
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
     *         description: Товар успешно создан.
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
     *       400:
     *         description: Неверный формат запроса.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       409:
     *         description: Артикул (SKU) уже существует.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

    /**
     * @swagger
     * /products/propose:
     *   post:
     *     summary: Предложение товара
     *     description: Создает предложение нового товара со статусом OUT_OF_STOCK (требуется роль WAREHOUSE_MANAGER).
     *     tags: [Products]
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
     *         description: Предложение товара успешно создано.
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
     *       400:
     *         description: Неверный формат запроса.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       409:
     *         description: Артикул (SKU) уже существует.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    // Метод createProduct уже охватывает /propose, поэтому документация добавлена выше

    /**
     * @swagger
     * /products:
     *   get:
     *     summary: Получение списка товаров
     *     description: Возвращает пагинированный список всех товаров с фильтрацией (требуется роль ADMIN, SUPERADMIN или WAREHOUSE_MANAGER).
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           example: 1
     *         description: Номер страницы.
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           example: 10
     *         description: Количество элементов на странице.
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
     *         description: Фильтр по статусу товара.
     *       - in: query
     *         name: active
     *         schema:
     *           type: boolean
     *         description: Фильтр по активности товара.
     *       - in: query
     *         name: cityId
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: Фильтр по идентификатору города.
     *       - in: query
     *         name: categoryIds
     *         schema:
     *           type: array
     *           items:
     *             type: integer
     *         description: Фильтр по идентификаторам категорий.
     *       - in: query
     *         name: name
     *         schema:
     *           type: string
     *         description: Частичное совпадение с названием товара.
     *       - in: query
     *         name: minPrice
     *         schema:
     *           type: number
     *           format: float
     *         description: Минимальная цена товара.
     *       - in: query
     *         name: maxPrice
     *         schema:
     *           type: number
     *           format: float
     *         description: Максимальная цена товара.
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [createdAt, name, price, quantity]
     *         description: Поле для сортировки.
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *         description: Порядок сортировки.
     *     responses:
     *       200:
     *         description: Список товаров успешно получен.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Товары успешно получены"
     *                 data:
     *                   $ref: '#/components/schemas/PaginatedProductsResponse'
     *       400:
     *         description: Неверный формат запроса.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

    /**
     * @swagger
     * /products/my:
     *   get:
     *     summary: Получение товаров, созданных пользователем
     *     description: Возвращает пагинированный список товаров, созданных текущим пользователем (требуется роль WAREHOUSE_MANAGER).
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           example: 1
     *         description: Номер страницы.
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           example: 10
     *         description: Количество элементов на странице.
     *     responses:
     *       200:
     *         description: Список товаров успешно получен.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Товары успешно получены"
     *                 data:
     *                   $ref: '#/components/schemas/PaginatedProductsResponse'
     *       400:
     *         description: Неверный формат запроса.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

    /**
     * @swagger
     * /products/stock:
     *   get:
     *     summary: Получение запасов товаров
     *     description: Возвращает пагинированный список доступных товаров (требуется роль ADMIN, SUPERADMIN или WAREHOUSE_MANAGER).
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           example: 1
     *         description: Номер страницы.
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           example: 10
     *         description: Количество элементов на странице.
     *     responses:
     *       200:
     *         description: Список запасов товаров успешно получен.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Запасы товаров успешно получены"
     *                 data:
     *                   $ref: '#/components/schemas/PaginatedStockProductsResponse'
     *       400:
     *         description: Неверный формат запроса.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

    /**
     * @swagger
     * /products/{id}:
     *   get:
     *     summary: Получение товара по ID
     *     description: Возвращает информацию о товаре по его идентификатору (требуется роль ADMIN, SUPERADMIN или WAREHOUSE_MANAGER).
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: Идентификатор товара.
     *     responses:
     *       200:
     *         description: Товар успешно получен.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Товар успешно получен"
     *                 data:
     *                   $ref: '#/components/schemas/ProductResponse'
     *       400:
     *         description: Неверный формат идентификатора.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: Товар не найден.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const product = await this.productsService.getProductById(id, req.user?.id, req.user?.role);
            this.sendSuccess(res, MESSAGES.PRODUCT_RETRIEVED, product);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /products/{id}:
     *   patch:
     *     summary: Обновление товара
     *     description: Обновляет информацию о товаре по его идентификатору (требуется роль ADMIN или SUPERADMIN).
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: Идентификатор товара.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProductUpdateDto'
     *     responses:
     *       200:
     *         description: Товар успешно обновлён.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Товар успешно обновлён"
     *                 data:
     *                   $ref: '#/components/schemas/ProductResponse'
     *       400:
     *         description: Неверный формат запроса.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: Товар не найден.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       409:
     *         description: Артикул (SKU) уже существует.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const product = await this.productsService.updateProduct(id, req.body, req.user?.id);
            this.sendSuccess(res, MESSAGES.PRODUCT_UPDATED, product);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /products/{id}/quantity:
     *   patch:
     *     summary: Обновление количества товара
     *     description: Обновляет количество товара на складе (требуется роль ADMIN, SUPERADMIN или WAREHOUSE_MANAGER).
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: Идентификатор товара.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProductPurchaseOrAddQuantityDto'
     *     responses:
     *       200:
     *         description: Количество товара успешно обновлено.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Количество товара успешно обновлено"
     *                 data:
     *                   $ref: '#/components/schemas/ProductResponse'
     *       400:
     *         description: Неверный формат запроса.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: Товар не найден.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       422:
     *         description: Неверное количество (например, отрицательное).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async updateProductQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const product = await this.productsService.updateProductQuantity(id, req.body, req.user?.id);
            this.sendSuccess(res, MESSAGES.PRODUCT_QUANTITY_UPDATED, product);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /products/{id}/purchase:
     *   post:
     *     summary: Покупка товара
     *     description: Выполняет покупку товара, уменьшая его количество на складе (требуется роль ADMIN, SUPERADMIN или WAREHOUSE_MANAGER).
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: Идентификатор товара.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ProductPurchaseOrAddQuantityDto'
     *     responses:
     *       200:
     *         description: Покупка товара успешно завершена.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Покупка товара успешно завершена"
     *                 data:
     *                   $ref: '#/components/schemas/ProductResponse'
     *       400:
     *         description: Неверный формат запроса.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: Товар не найден.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       422:
     *         description: Недостаточное количество товара или товар не доступен.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async purchaseProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const product = await this.productsService.purchaseProduct(id, req.body, req.user?.id);
            this.sendSuccess(res, MESSAGES.PRODUCT_PURCHASE_COMPLETED, product);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /products/{id}:
     *   delete:
     *     summary: Удаление товара
     *     description: Выполняет мягкое удаление товара по его идентификатору (требуется роль ADMIN или SUPERADMIN).
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: Идентификатор товара.
     *     responses:
     *       200:
     *         description: Товар успешно удалён.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Товар успешно удалён"
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                       example: 1
     *       400:
     *         description: Неверный формат идентификатора.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Неавторизованный доступ.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Доступ запрещён (недостаточно прав).
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: Товар не найден.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       422:
     *         description: Нельзя удалить активный товар.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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