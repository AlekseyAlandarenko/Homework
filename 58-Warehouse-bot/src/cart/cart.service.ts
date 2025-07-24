import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ICartService } from './cart.service.interface';
import { CartResponse, ICartRepository } from './cart.repository.interface';
import {
	IProductsRepository,
	ProductWithRelations,
} from '../products/products.repository.interface';
import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { Cart } from './cart.entity';
import { CartResponseDto } from './dto/cart-response.dto';
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
		errorPrefix = '',
	): Promise<void> {
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
		const product = await this.productsRepository.findProductByKey('id', dto.productId);
		if (!product) throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);

		let price = product.price;

		if (dto.optionId) {
			const option = product.options.find((opt) => opt.id === dto.optionId);
			if (!option) throw new HTTPError(404, MESSAGES.OPTION_NOT_FOUND);
			price += option.priceModifier;
		}

		const existingCartItem = await this.cartRepository.findCartItem(
			userId,
			dto.productId,
			dto.optionId ?? null,
		);

		const currentQuantity = existingCartItem?.quantity || 0;

		await this.validateProductAvailability(product, dto.quantity);

		if (currentQuantity + dto.quantity > product.quantity) {
			throw new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
		}

		const cart = new Cart(userId, dto.productId, dto.quantity, price, dto.optionId);
		const cartItem = await this.cartRepository.addCartItem(cart);

		const option = cartItem.optionId
			? product.options.find((opt) => opt.id === cartItem.optionId)
			: undefined;

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
			option: option
				? {
						id: option.id,
						name: option.name,
						value: option.value,
						priceModifier: option.priceModifier,
					}
				: undefined,
		};
	}

	async getCartItems(userId: number): Promise<CartResponseDto> {
		const cartItems = await this.cartRepository.getCartItems(userId);

		const items = cartItems.map((item) => ({
			id: item.id,
			productId: item.productId,
			quantity: item.quantity,
			price: item.price,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
			product: {
				name: item.product.name,
			},
			option: item.option
				? {
						id: item.option.id,
						name: item.option.name,
						value: item.option.value,
						priceModifier: item.option.priceModifier,
					}
				: undefined,
		}));

		const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		return { items, total };
	}

	async checkoutCartItems(userId: number, dto: CartCheckoutDto): Promise<CartResponseDto> {
		await this.prismaService.validateAddresses([dto.addressId], userId);

		const cartItems = await this.cartRepository.getCartItems(userId);
		for (const item of dto.items) {
			const cartItem = cartItems.find(
				(ci) =>
					ci.productId === item.productId && (ci.optionId ?? null) === (item.optionId ?? null),
			);
			if (!cartItem) {
				throw new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND);
			}
			if (cartItem.quantity < item.quantity) {
				throw new HTTPError(422, MESSAGES.INSUFFICIENT_QUANTITY_IN_CART);
			}
		}

		const productCache = new Map<number, ProductWithRelations>();
		for (const item of dto.items) {
			let product = productCache.get(item.productId);
			if (!product) {
				const foundProduct = await this.productsRepository.findProductByKey('id', item.productId);
				if (!foundProduct) throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
				product = foundProduct;
				productCache.set(item.productId, product);
			}
			await this.validateProductAvailability(product, item.quantity);
		}

		const itemsToUpdate = dto.items.map((item) => ({
			productId: item.productId,
			quantity: item.quantity,
			optionId: item.optionId ?? null,
		}));

		const updatedCart = await this.cartRepository.checkoutCartItems(userId, itemsToUpdate);
		const resultItems = updatedCart.map((item) => ({
			id: item.id,
			productId: item.productId,
			quantity: item.quantity,
			price: item.price,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
			product: {
				name: item.product.name,
			},
			option: item.option
				? {
						id: item.option.id,
						name: item.option.name,
						value: item.option.value,
						priceModifier: item.option.priceModifier,
					}
				: undefined,
		}));

		const total = resultItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
		return { items: resultItems, total };
	}

	async removeCartItem(userId: number, productId: number, optionId?: number): Promise<void> {
		const result = await this.cartRepository.removeCartItem(userId, productId, optionId ?? null);
		if (result.count === 0) {
			throw new HTTPError(404, MESSAGES.CART_ITEM_NOT_FOUND);
		}
	}

	async removeAllCartItems(userId: number): Promise<void> {
		await this.cartRepository.removeAllCartItems(userId);
	}
}
