import { Cart } from './cart.entity';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { CartModel } from '@prisma/client';

export interface ICartRepository {
	addToCart(cart: Cart): Promise<CartModel>;
	getCart(userId: number): Promise<CartModel[]>;
	checkout(userId: number, dto: CartCheckoutDto): Promise<CartModel[]>;
	removeFromCart(userId: number, productId: number): Promise<void>;
}
