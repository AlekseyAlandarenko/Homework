import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { CartModel } from '@prisma/client';
import { CartResponseDto } from './dto/cart-response.dto';

export type CartWithProduct = CartModel & { product: { name: string; price: number } };

export interface ICartService {
	addToCart(email: string, dto: CartAddDto): Promise<CartModel>;
	getCart(email: string): Promise<CartResponseDto>;
	checkout(email: string, dto: CartCheckoutDto): Promise<CartModel[]>;
	removeFromCart(email: string, productId: number): Promise<void>;
}
