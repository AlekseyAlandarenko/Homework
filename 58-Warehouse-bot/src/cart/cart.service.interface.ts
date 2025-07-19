import { CartAddDto } from './dto/cart-add.dto';
import { CartCheckoutDto } from './dto/cart-checkout.dto';
import { CartResponseDto, CartResponse } from './dto/cart-response.dto';

export interface ICartService {
	addCartItem(userId: number, dto: CartAddDto): Promise<CartResponse>;
	getCartItems(userId: number): Promise<CartResponseDto>;
	checkoutCartItems(userId: number, dto: CartCheckoutDto): Promise<CartResponseDto>;
	removeCartItem(userId: number, productId: number, optionId?: number): Promise<void>;
	removeAllCartItems(userId: number): Promise<void>;
}
