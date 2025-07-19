import { IsArray, IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { MESSAGES } from '../../common/messages';

export interface CartResponse {
	id: number;
	productId: number;
	quantity: number;
	price: number;
	createdAt: string;
	updatedAt: string;
	product: {
		name: string;
	};
	option?: {
		id: number;
		name: string;
		value: string;
		priceModifier: number;
	};
}

export class CartResponseDto {
	@IsArray({ message: MESSAGES.ITEMS_INVALID_ARRAY })
	@IsNotEmpty({ message: MESSAGES.ITEMS_REQUIRED_FIELD })
	items!: CartResponse[];

	@IsNumber({}, { message: MESSAGES.TOTAL_INVALID_FORMAT })
	@IsNotEmpty({ message: MESSAGES.TOTAL_REQUIRED_FIELD })
	total!: number;
}
