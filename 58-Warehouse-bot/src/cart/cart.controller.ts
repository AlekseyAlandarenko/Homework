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

	async addCartItem({ body, user }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const cartItem = await this.cartService.addCartItem(user!.id, body);
			this.sendCreated(res, MESSAGES.CART_ITEM_ADDED, cartItem);
		} catch (err) {
			next(err);
		}
	}

	async getCartItems({ user }: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const cart = await this.cartService.getCartItems(user!.id);
			this.sendSuccess(res, MESSAGES.CART_RETRIEVED, cart);
		} catch (err) {
			next(err);
		}
	}

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

	async removeCartItem(
		{ params, user }: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const productId = parseInt(params.productId);
			await this.cartService.removeCartItem(user!.id, productId);
			this.sendSuccess(res, MESSAGES.CART_ITEM_DELETED, null);
		} catch (err) {
			next(err);
		}
	}
}
