import { injectable, inject } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { ICartRepository, CartWithProduct } from './cart.repository.interface';
import { TYPES } from '../types';
import { Cart } from './cart.entity';
import { CartModel } from '@prisma/client';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

@injectable()
export class CartRepository implements ICartRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async addCartItem(cart: Cart): Promise<CartModel> {
		try {
			const result = await this.prismaService.client.cartModel.upsert({
				where: {
					userId_productId: { userId: cart.userId, productId: cart.productId },
				},
				update: {
					quantity: { increment: cart.quantity },
					price: cart.price,
					updatedAt: new Date(),
				},
				create: {
					userId: cart.userId,
					productId: cart.productId,
					quantity: cart.quantity,
					price: cart.price,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});
			return result;
		} catch (error) {
			console.error('addCartItem error:', error);
			throw new HTTPError(500, MESSAGES.CART_ADD_FAILED);
		}
	}

	async getCartItems(userId: number): Promise<CartWithProduct[]> {
		return this.prismaService.client.cartModel.findMany({
			where: { userId },
			include: { product: { select: { name: true, price: true } } },
		}) as Promise<CartWithProduct[]>;
	}

	async checkoutCartItems(
		userId: number,
		items: { productId: number; quantity: number }[],
	): Promise<CartModel[]> {
		const cartItems = await this.prismaService.client.cartModel.findMany({
			where: { userId },
		});
		await this.prismaService.client.$transaction(async (prisma) => {
			await prisma.cartModel.deleteMany({ where: { userId } });
		});
		return cartItems;
	}

	async findCartItem(userId: number, productId: number): Promise<CartModel | null> {
		return this.prismaService.client.cartModel.findUnique({
			where: {
				userId_productId: { userId, productId },
			},
		});
	}

	async removeCartItem(userId: number, productId: number): Promise<void> {
		await this.prismaService.client.cartModel.delete({
			where: {
				userId_productId: { userId, productId },
			},
		});
	}

	async removeAllCartItems(userId: number): Promise<void> {
		await this.prismaService.client.cartModel.deleteMany({
			where: { userId },
		});
	}
}
