import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { ProductPurchaseOrAddQuantityDto } from './dto/product-purchase-or-add-quantity.dto';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductStatus } from '../common/enums/product-status.enum';
import { Role } from '../common/enums/role.enum';
import { ProductWithRelations } from './products.repository.interface';

export interface IProductsService {
	createProduct(
		dto: ProductCreateDto & {
			userId?: number;
			status: ProductStatus;
			createdById?: number;
		},
	): Promise<ProductWithRelations>;
	getProductsByCreator(
		creatorId: number,
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<ProductWithRelations>>;
	getAllProducts({
		filters,
		pagination,
	}: {
		filters?: ProductFilterDto;
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<ProductWithRelations>>;
	getStockProducts(
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<{ id: number; sku: string; quantity: number }>>;
	getProductById(id: number, userId?: number, userRole?: Role): Promise<ProductWithRelations>;
	getProductsForUser(
		telegramId: string,
		pagination: PaginationDto,
	): Promise<PaginatedResponse<ProductWithRelations>>;
	updateProduct(id: number, dto: ProductUpdateDto, userId?: number): Promise<ProductWithRelations>;
	updateProductQuantity(
		id: number,
		dto: ProductPurchaseOrAddQuantityDto,
		userId?: number,
	): Promise<ProductWithRelations>;
	purchaseProduct(
		id: number,
		dto: ProductPurchaseOrAddQuantityDto,
		userId?: number,
	): Promise<ProductWithRelations>;
	deleteProduct(id: number, userId?: number): Promise<ProductWithRelations>;
}
