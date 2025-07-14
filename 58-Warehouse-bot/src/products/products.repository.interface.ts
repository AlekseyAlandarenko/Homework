import { Prisma, ProductModel } from '@prisma/client';
import { Product } from './product.entity';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

export type ProductWithRelations = ProductModel & {
	categories: { id: number; name: string }[];
	city: { id: number; name: string } | null;
};

export interface IProductsRepository {
	productInclude: Prisma.ProductModelInclude;
	createProduct(product: Product): Promise<ProductWithRelations>;
	findProductByKey(
		key: keyof ProductWithRelations,
		value: string | number | boolean,
		userId?: number,
		includeDeleted?: boolean,
	): Promise<ProductWithRelations | null>;
	findProductByKeyOrThrow(
		key: keyof ProductWithRelations,
		value: string | number | boolean,
		userId?: number,
		errorMessage?: string,
	): Promise<ProductWithRelations>;
	findProductsByCreator(
		creatorId: number,
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<ProductWithRelations>>;
	findAllProducts({
		filters,
		orderBy,
		pagination,
	}: {
		filters?: Prisma.ProductModelWhereInput;
		orderBy?: Prisma.ProductModelOrderByWithRelationInput;
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<ProductWithRelations>>;
	findStockProducts(
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<{ id: number; sku: string; quantity: number }>>;
	updateProduct(id: number, data: Prisma.ProductModelUpdateInput): Promise<ProductWithRelations>;
	updateProductCreator(currentCreatorId: number, newCreatorId: number): Promise<void>;
	deleteProduct(id: number): Promise<ProductWithRelations>;
}
