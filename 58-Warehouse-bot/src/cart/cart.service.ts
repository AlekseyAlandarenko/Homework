import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ICartService } from './cart.service.interface';
import { ICartRepository } from './cart.repository.interface';
import {
	IProductsRepository,
	ProductWithRelations,
} from '../products/products.repository.interface';
import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { CartModel } from '@prisma/client';
import { Cart } from './cart.entity';
import { CartResponseDto, CartResponse } from './dto/cart-response.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { ProductStatus } from '../common/enums/product-status.enum';
import { PrismaService } from '../database/prisma.service';

@injectable()
export class CartService implements ICartService {
	constructor(
		@inject(TYPES.CartRepository) private cartRepository: ICartRepository,
		@inject(TYPES.ProductsRepository) private productsRepository: IProductsRepository,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
	) {}

	private async validateProductAvailability(
		product: ProductWithRelations,
		quantity: number,
		errorPrefix: string = '',
	): Promise<void> {
		if (product.isDeleted) {
			throw new HTTPError(404, `${errorPrefix}${MESSAGES.PRODUCT_NOT_FOUND}`);
		}
		if (product.quantity === 0) {
			throw new HTTPError(422, `${errorPrefix}${MESSAGES.PRODUCT_OUT_OF_STOCK}`);
		}
		if (product.status !== ProductStatus.AVAILABLE) {
			throw new HTTPError(422, `${errorPrefix}${MESSAGES.PRODUCT_NOT_ACTIVE}`);
		}
		if (product.quantity < quantity) {
			throw new HTTPError(422, `${errorPrefix}${MESSAGES.PRODUCT_INSUFFICIENT_STOCK}`);
		}
	}

	async addCartItem(userId: number, dto: CartAddDto): Promise<CartResponse> {
		const product = await this.productsRepository.findProductByKeyOrThrow('id', dto.productId);
		// Проверка текущего количества в корзине
		const existingCartItem = await this.cartRepository.findCartItem(userId, dto.productId);
		const currentQuantity = existingCartItem?.quantity || 0;

		// Сначала проверяем доступность товара (включает product.quantity === 0)
		await this.validateProductAvailability(product, dto.quantity);
		// Затем проверяем суммарное количество (текущее + новое) против остатка
		if (currentQuantity + dto.quantity > product.quantity) {
			throw new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
		}

		const cart = new Cart(userId, dto.productId, dto.quantity, product.price);
		const cartItem = await this.cartRepository.addCartItem(cart);
		return {
			id: cartItem.id,
			productId: cartItem.productId,
			quantity: cartItem.quantity,
			price: cartItem.price,
			createdAt: cartItem.createdAt.toISOString(),
			updatedAt: cartItem.updatedAt.toISOString(),
			product: {
				name: product.name,
			},
		};
	}

	async getCartItems(userId: number): Promise<CartResponseDto> {
		const carts = await this.cartRepository.getCartItems(userId);

		const items = carts.map((item) => ({
			id: item.id,
			productId: item.productId,
			quantity: item.quantity,
			price: item.price,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
			product: {
				name: item.product.name,
			},
		}));

		const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		return {
			items,
			total,
		};
	}

	async checkoutCartItems(userId: number, dto: CartCheckoutDto): Promise<CartModel[]> {
		return this.prismaService.client.$transaction(async (prisma) => {
			const cartItems = await this.cartRepository.getCartItems(userId);
			const productCache = new Map<number, ProductWithRelations>();

			for (const item of dto.items) {
				const cartItem = cartItems.find((ci) => ci.productId === item.productId);
				if (!cartItem) {
					throw new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND);
				}
				if (cartItem.quantity < item.quantity) {
					throw new HTTPError(422, MESSAGES.INSUFFICIENT_QUANTITY_IN_CART);
				}
			}

			for (const item of dto.items) {
				let product = productCache.get(item.productId);
				if (!product) {
					product = await this.productsRepository.findProductByKeyOrThrow('id', item.productId);
					productCache.set(item.productId, product);
				}
				await this.validateProductAvailability(product, item.quantity);
			}

			const itemsToUpdate = await Promise.all(
				dto.items.map(async (item) => {
					const product = productCache.get(item.productId)!;
					const newQuantity = product.quantity - item.quantity;
					const status = newQuantity === 0 ? ProductStatus.OUT_OF_STOCK : product.status;
					await this.productsRepository.updateProduct(item.productId, {
						quantity: newQuantity,
						status,
					});
					return { productId: item.productId, quantity: item.quantity };
				}),
			);

			return this.cartRepository.checkoutCartItems(userId, itemsToUpdate);
		});
	}

	async removeCartItem(userId: number, productId: number): Promise<void> {
		const cartItem = await this.cartRepository.findCartItem(userId, productId);
		if (!cartItem) {
			throw new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND);
		}
		await this.cartRepository.removeCartItem(userId, productId);
	}

	async removeAllCartItems(userId: number): Promise<void> {
		await this.cartRepository.removeAllCartItems(userId);
	}
}
