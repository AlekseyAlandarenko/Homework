import { injectable, inject } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { ICartRepository, CartWithProduct } from './cart.repository.interface';
import { TYPES } from '../types';
import { Cart } from './cart.entity';
import { CartModel } from '@prisma/client';
import { ProductStatus } from '../common/enums/product-status.enum';

@injectable()
export class CartRepository implements ICartRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async addCartItem(cart: Cart): Promise<CartModel> {
		const existingItem = await this.prismaService.client.cartModel.findFirst({
			where: {
				userId: cart.userId,
				productId: cart.productId,
				optionId: cart.optionId ?? null,
			},
		});

		if (existingItem) {
			return this.prismaService.client.cartModel.update({
				where: { id: existingItem.id },
				data: {
					quantity: { increment: cart.quantity },
					price: cart.price,
					updatedAt: new Date(),
				},
			});
		}

		return this.prismaService.client.cartModel.create({
			data: {
				userId: cart.userId,
				productId: cart.productId,
				optionId: cart.optionId ?? null,
				quantity: cart.quantity,
				price: cart.price,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
	}

	async getCartItems(userId: number): Promise<CartWithProduct[]> {
		return this.prismaService.client.cartModel.findMany({
			where: { userId },
			include: {
				product: { select: { name: true, price: true } },
				option: { select: { id: true, name: true, value: true, priceModifier: true } },
			},
		}) as Promise<CartWithProduct[]>;
	}

	async checkoutCartItems(
		userId: number,
		items: { productId: number; quantity: number; optionId: number | null }[],
	): Promise<CartWithProduct[]> {
		const cartItems = await this.prismaService.client.cartModel.findMany({
			where: { userId },
			include: {
				product: {
					include: {
						categories: true,
						city: true,
						options: true,
					},
				},
				option: true,
			},
		});

		await this.prismaService.client.$transaction(async (prisma) => {
			for (const item of items) {
				const product = await prisma.productModel.findUnique({
					where: { id: item.productId },
					select: { quantity: true, status: true },
				});

				const newQuantity = product ? product.quantity - item.quantity : 0;

				await prisma.productModel.update({
					where: { id: item.productId },
					data: {
						quantity: { decrement: item.quantity },
						status: {
							set: newQuantity === 0 ? ProductStatus.OUT_OF_STOCK : product?.status,
						},
					},
				});
			}
			await prisma.cartModel.deleteMany({ where: { userId } });
		});

		return cartItems.map((item) => ({
			...item,
			option: item.option ?? undefined,
		})) as CartWithProduct[];
	}

	async findCartItem(
		userId: number,
		productId: number,
		optionId: number | null,
	): Promise<CartModel | null> {
		return this.prismaService.client.cartModel.findFirst({
			where: {
				userId,
				productId,
				optionId: optionId ?? null,
			},
		});
	}

	async removeCartItem(
		userId: number,
		productId: number,
		optionId: number | null,
	): Promise<{ count: number }> {
		return this.prismaService.client.cartModel.deleteMany({
			where: {
				userId,
				productId,
				optionId: optionId ?? null,
			},
		});
	}

	async removeAllCartItems(userId: number): Promise<void> {
		await this.prismaService.client.cartModel.deleteMany({
			where: { userId },
		});
	}
}
