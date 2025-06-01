import { ProductModel } from '@prisma/client';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { ProductPurchaseOrAddQuantityDto } from './dto/product-purchase-or-add-quantity.dto';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

export interface IProductsService {
	createProduct(dto: ProductCreateDto & { userEmail?: string }): Promise<ProductModel>;
	getAllProducts(params?: {
		filters?: {
			name?: string;
			minPrice?: number;
			maxPrice?: number;
			category?: string;
			isActive?: boolean;
			available?: boolean;
		};
		orderBy?: { sortBy?: string; sortOrder?: string };
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<ProductModel>>;
	getProductsByCreator(
		userEmail?: string,
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<ProductModel>>;
	getStock(
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<{ id: number; sku: string; quantity: number }>>;
	getProductById(id: number, userId: number, role: string): Promise<ProductModel | null>;
	updateProduct(id: number, dto: ProductUpdateDto, userEmail?: string): Promise<ProductModel>;
	updateProductQuantity(
		id: number,
		dto: ProductPurchaseOrAddQuantityDto,
		userEmail?: string,
	): Promise<ProductModel>;
	purchaseProduct(
		id: number,
		dto: ProductPurchaseOrAddQuantityDto,
		userEmail?: string,
	): Promise<ProductModel>;
	deleteProduct(id: number, userEmail?: string): Promise<ProductModel>;
}
