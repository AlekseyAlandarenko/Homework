import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ICartRepository } from './cart.repository.interface';
import { PrismaService } from '../database/prisma.service';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { Cart } from './cart.entity';
import { CartModel } from '@prisma/client';
import { CartCheckoutDto } from './dto/cart-checkout.dto';

@injectable()
export class CartRepository implements ICartRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async addToCart(cart: Cart): Promise<CartModel> {
		return this.prismaService.client.cartModel.upsert({
			where: {
				userId_productId: { userId: cart.userId, productId: cart.productId },
			},
			update: { quantity: { increment: cart.quantity }, updatedAt: new Date() },
			create: {
				userId: cart.userId,
				productId: cart.productId,
				quantity: cart.quantity,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
	}

	async getCart(userId: number): Promise<CartModel[]> {
		return this.prismaService.client.cartModel.findMany({
			where: { userId },
			include: { product: { select: { name: true, price: true } } },
		});
	}

	async checkout(userId: number, dto: CartCheckoutDto): Promise<CartModel[]> {
		const cartItems = await this.prismaService.client.cartModel.findMany({
			where: { userId },
		});
		await this.prismaService.client.$transaction(async (prisma) => {
			for (const item of dto.items) {
				const product = await prisma.productModel.findFirst({
					where: { id: item.productId, isDeleted: false },
				});
				if (!product) {
					throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
				}
				if (product.quantity === 0) {
					throw new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK);
				}
				if (product.quantity < item.quantity) {
					throw new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
				}
				await prisma.productModel.update({
					where: { id: item.productId },
					data: { quantity: { decrement: item.quantity } },
				});
			}
			await prisma.cartModel.deleteMany({ where: { userId } });
		});
		return cartItems;
	}

	async removeFromCart(userId: number, productId: number): Promise<void> {
		const cartItem = await this.prismaService.client.cartModel.findUnique({
			where: {
				userId_productId: { userId, productId },
			},
		});

		if (!cartItem) {
			throw new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND);
		}

		await this.prismaService.client.cartModel.delete({
			where: {
				userId_productId: { userId, productId },
			},
		});
	}
}
