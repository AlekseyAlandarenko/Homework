import { Cart } from './cart.entity';
import { CartModel } from '@prisma/client';
import { ProductWithRelations } from '../products/products.repository.interface';

export interface CartWithProduct extends CartModel {
	product: ProductWithRelations & { name: string };
}

export interface ICartRepository {
	addCartItem(cart: Cart): Promise<CartModel>;
	getCartItems(userId: number): Promise<CartWithProduct[]>;
	checkoutCartItems(
		userId: number,
		items: { productId: number; quantity: number }[],
	): Promise<CartModel[]>;
	findCartItem(userId: number, productId: number): Promise<CartModel | null>;
	removeCartItem(userId: number, productId: number): Promise<void>;
	removeAllCartItems(userId: number): Promise<void>;
}
