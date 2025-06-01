import { ProductModel, Prisma } from '@prisma/client';
import { Product } from './product.entity';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

export interface IProductsRepository {
	create(product: Product): Promise<ProductModel>;
	findById(id: number, userId?: number): Promise<ProductModel | null>;
	findByIdOrThrow(id: number): Promise<ProductModel>;
	findBySku(sku: string): Promise<ProductModel | null>;
	findAll(params: {
		pagination: PaginationDto;
		filters?: Prisma.ProductModelWhereInput;
		orderBy?: Prisma.ProductModelOrderByWithRelationInput;
	}): Promise<PaginatedResponse<ProductModel>>;
	findStock(
		pagination: PaginationDto,
	): Promise<PaginatedResponse<{ id: number; sku: string; quantity: number }>>;
	findByCreator(
		creatorId: number,
		pagination: PaginationDto,
	): Promise<PaginatedResponse<ProductModel>>;
	update(id: number, data: Partial<ProductModel>): Promise<ProductModel>;
	delete(id: number): Promise<ProductModel>;
}
