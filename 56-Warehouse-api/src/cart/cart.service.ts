import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ICartService, CartWithProduct } from './cart.service.interface';
import { ICartRepository } from './cart.repository.interface';
import { IProductsRepository } from '../products/products.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { CartModel } from '@prisma/client';
import { Cart } from './cart.entity';
import { validateUserExists, validateId, validatePurchaseQuantity } from '../common/validators';
import { CartResponseDto } from './dto/cart-response.dto';

@injectable()
export class CartService implements ICartService {
	constructor(
		@inject(TYPES.CartRepository) private cartRepository: ICartRepository,
		@inject(TYPES.ProductsRepository) private productsRepository: IProductsRepository,
		@inject(TYPES.UsersService) private usersService: IUsersService,
	) {}

	async addToCart(email: string, dto: CartAddDto): Promise<CartModel> {
		validateId(dto.productId);
		const user = await validateUserExists(email, this.usersService);
		const product = await this.productsRepository.findByIdOrThrow(dto.productId);
		validatePurchaseQuantity(product.quantity, dto.quantity);

		const cart = new Cart(user.id, dto.productId, dto.quantity, product.price);
		return this.cartRepository.addToCart(cart);
	}

	async getCart(email: string): Promise<CartResponseDto> {
		const user = await validateUserExists(email, this.usersService);
		const carts = (await this.cartRepository.getCart(user.id)) as CartWithProduct[];

		const items = carts.map((item) => ({
			id: item.id,
			productId: item.productId,
			quantity: item.quantity,
			price: item.product.price,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
		}));

		const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		return {
			items,
			total,
		};
	}

	async checkout(email: string, dto: CartCheckoutDto): Promise<CartModel[]> {
		const user = await validateUserExists(email, this.usersService);
		for (const item of dto.items) {
			validateId(item.productId);
			const product = await this.productsRepository.findByIdOrThrow(item.productId);
			validatePurchaseQuantity(product.quantity, item.quantity);
		}
		return this.cartRepository.checkout(user.id, dto);
	}

	async removeFromCart(email: string, productId: number): Promise<void> {
		validateId(productId);
		const user = await validateUserExists(email, this.usersService);
		const product = await this.productsRepository.findByIdOrThrow(productId);
		await this.cartRepository.removeFromCart(user.id, productId);
	}
}
