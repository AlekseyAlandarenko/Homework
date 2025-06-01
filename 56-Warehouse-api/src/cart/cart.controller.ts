import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';
import { ICartController } from './cart.controller.interface';
import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { ICartService } from './cart.service.interface';
import { AuthGuard } from '../common/auth.guard';
import { RoleGuard } from '../common/role.guard';
import { ValidateMiddleware } from '../common/validate.middleware';
import { MESSAGES } from '../common/messages';
import { HTTPError } from '../errors/http-error.class';

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Управление корзиной
 */
@injectable()
export class CartController extends BaseController implements ICartController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.CartService) private cartService: ICartService,
	) {
		super(loggerService);
		this.bindRoutes([
			{
				path: '/',
				method: 'post',
				func: this.addToCart,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
					new ValidateMiddleware(CartAddDto),
				],
			},
			{
				path: '/',
				method: 'get',
				func: this.getCart,
				middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'])],
			},
			{
				path: '/checkout',
				method: 'post',
				func: this.checkout,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
					new ValidateMiddleware(CartCheckoutDto),
				],
			},
			{
				path: '/:productId',
				method: 'delete',
				func: this.removeFromCart,
				middlewares: [new AuthGuard(), new RoleGuard(['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'])],
			},
		]);
	}

	/**
	 * @swagger
	 * /cart:
	 *   post:
	 *     tags: [Cart]
	 *     summary: Добавление товара в корзину
	 *     description: Добавляет товар в корзину пользователя с проверкой наличия. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CartAddDto'
	 *     responses:
	 *       201:
	 *         description: Товар успешно добавлен в корзину
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Товар успешно добавлен в корзину"
	 *                 data:
	 *                   $ref: '#/components/schemas/CartResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Товар не найден
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async addToCart({ body, user }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const cartItem = await this.cartService.addToCart(user!.email, body);
			this.ok(res, { message: MESSAGES.CART_ITEM_ADDED, data: cartItem });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /cart:
	 *   get:
	 *     tags: [Cart]
	 *     summary: Получение содержимого корзины
	 *     description: Возвращает список товаров в корзине пользователя с итоговой суммой. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Содержимое корзины
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   $ref: '#/components/schemas/CartResponseDto'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 */
	async getCart({ user }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const cart = await this.cartService.getCart(user!.email);
			this.ok(res, { data: cart });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /cart/checkout:
	 *   post:
	 *     tags: [Cart]
	 *     summary: Оформление заказа из корзины
	 *     description: Оформляет заказ из корзины, уменьшая количество товаров на складе. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CartCheckoutDto'
	 *     responses:
	 *       200:
	 *         description: Заказ успешно оформлен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Заказ успешно оформлен"
	 *                 data:
	 *                   type: array
	 *                   items:
	 *                     $ref: '#/components/schemas/CartResponse'
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Товар не найден
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async checkout({ body, user }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const cartItems = await this.cartService.checkout(user!.email, body);
			this.ok(res, { message: MESSAGES.CHECKOUT_COMPLETED, data: cartItems });
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /cart/{productId}:
	 *   delete:
	 *     tags: [Cart]
	 *     summary: Удаление товара из корзины
	 *     description: Удаляет товар из корзины пользователя. Доступно для SUPERADMIN, ADMIN и WAREHOUSE_MANAGER.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: productId
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: Идентификатор товара
	 *     responses:
	 *       200:
	 *         description: Товар успешно удален из корзины
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: "Товар успешно удален из корзины"
	 *       401:
	 *         description: Не авторизован
	 *       403:
	 *         description: Доступ запрещен
	 *       404:
	 *         description: Товар не найден в корзине
	 *       422:
	 *         description: Ошибка валидации данных
	 */
	async removeFromCart(
		{ params, user }: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const productId = parseInt(params.productId);
			await this.cartService.removeFromCart(user!.email, productId);
			this.ok(res, { message: MESSAGES.CART_ITEM_REMOVED });
		} catch (err) {
			next(err);
		}
	}
}
