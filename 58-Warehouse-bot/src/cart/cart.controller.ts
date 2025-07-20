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
import { FULL_ACCESS_ROLES } from '../common/constants';

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
				func: this.addCartItem,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateMiddleware(CartAddDto),
				],
			},
			{
				path: '/',
				method: 'get',
				func: this.getCartItems,
				middlewares: [new AuthGuard(), new RoleGuard(FULL_ACCESS_ROLES)],
			},
			{
				path: '/checkout',
				method: 'post',
				func: this.checkoutCartItems,
				middlewares: [
					new AuthGuard(),
					new RoleGuard(FULL_ACCESS_ROLES),
					new ValidateMiddleware(CartCheckoutDto),
				],
			},
			{
				path: '/:productId',
				method: 'delete',
				func: this.removeCartItem,
				middlewares: [new AuthGuard(), new RoleGuard(FULL_ACCESS_ROLES)],
			},
		]);
	}

	private sendSuccess<T>(res: Response, message: string, data: T): void {
		this.ok(res, { message, data });
	}

	private sendCreated<T>(res: Response, message: string, data: T): void {
		this.created(res, { message, data });
	}

	/**
	 * @swagger
	 * /cart:
	 *   post:
	 *     summary: Добавление товара в корзину
	 *     tags: [Cart]
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
	 *                   example: Товар успешно добавлен в корзину
	 *                 data:
	 *                   $ref: '#/components/schemas/CartResponse'
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Доступ запрещён
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       404:
	 *         description: Товар или опция не найдены
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       422:
	 *         description: Товар отсутствует на складе или недостаточное количество
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async addCartItem({ body, user }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const cartItem = await this.cartService.addCartItem(user!.id, body);
			this.sendCreated(res, MESSAGES.CART_ITEM_ADDED, cartItem);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /cart:
	 *   get:
	 *     summary: Получение содержимого корзины
	 *     tags: [Cart]
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Корзина успешно получена
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Корзина успешно получена
	 *                 data:
	 *                   $ref: '#/components/schemas/CartResponseDto'
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Доступ запрещён
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       422:
	 *         description: Ошибка валидации
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async getCartItems({ user }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const cart = await this.cartService.getCartItems(user!.id);
			this.sendSuccess(res, MESSAGES.CART_RETRIEVED, cart);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /cart/checkout:
	 *   post:
	 *     summary: Оформление заказа из корзины
	 *     tags: [Cart]
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
	 *                   example: Заказ успешно оформлен
	 *                 data:
	 *                   $ref: '#/components/schemas/CartResponseDto'
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Доступ запрещён
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       404:
	 *         description: Товар, элемент корзины или адрес не найдены
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       422:
	 *         description: Недостаточное количество товара или товар не доступен
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async checkoutCartItems(
		{ body, user }: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const cartItems = await this.cartService.checkoutCartItems(user!.id, body);
			this.sendSuccess(res, MESSAGES.CHECKOUT_COMPLETED, cartItems);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * @swagger
	 * /cart/{productId}:
	 *   delete:
	 *     summary: Удаление товара из корзины
	 *     tags: [Cart]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: productId
	 *         required: true
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *         description: Идентификатор товара для удаления из корзины
	 *       - in: query
	 *         name: optionId
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *         description: Идентификатор опции товара (если применимо)
	 *     responses:
	 *       200:
	 *         description: Товар успешно удалён из корзины
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *                   example: Товар успешно удалён из корзины
	 *                 data:
	 *                   type: null
	 *       400:
	 *         description: Неверный формат данных
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       401:
	 *         description: Не авторизован
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       403:
	 *         description: Доступ запрещён
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 *       404:
	 *         description: Элемент корзины не найден
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponse'
	 */
	async removeCartItem(
		{ params, query, user }: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const productId = parseInt(params.productId);
			const optionId = query.optionId ? parseInt(query.optionId as string) : undefined;
			await this.cartService.removeCartItem(user!.id, productId, optionId);
			this.sendSuccess(res, MESSAGES.CART_ITEM_DELETED, null);
		} catch (err) {
			next(err);
		}
	}
}
