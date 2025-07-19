import { Cart } from './cart.entity';
import { CartModel } from '@prisma/client';
import { ProductWithRelations } from '../products/products.repository.interface';

export interface CartWithProduct extends CartModel {
	product: ProductWithRelations & { name: string };
	option?: { id: number; name: string; value: string; priceModifier: number };
}

export interface ICartRepository {
	addCartItem(cart: Cart): Promise<CartModel>;
	getCartItems(userId: number): Promise<CartWithProduct[]>;
	checkoutCartItems(
		userId: number,
		items: { productId: number; quantity: number; optionId: number | null }[],
	): Promise<CartWithProduct[]>;
	findCartItem(
		userId: number,
		productId: number,
		optionId: number | null,
	): Promise<CartModel | null>;
	removeCartItem(
		userId: number,
		productId: number,
		optionId: number | null,
	): Promise<{ count: number }>;
	removeAllCartItems(userId: number): Promise<void>;
}
