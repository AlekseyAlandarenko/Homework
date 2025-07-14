import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { CartModel } from '@prisma/client';
import { CartResponseDto, CartResponse } from './dto/cart-response.dto';

export interface ICartService {
	addCartItem(userId: number, dto: CartAddDto): Promise<CartResponse>;
	getCartItems(userId: number): Promise<CartResponseDto>;
	checkoutCartItems(userId: number, dto: CartCheckoutDto): Promise<CartModel[]>;
	removeCartItem(userId: number, productId: number): Promise<void>;
	removeAllCartItems(userId: number): Promise<void>;
}
