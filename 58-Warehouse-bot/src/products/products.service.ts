import { inject, injectable } from 'inversify';
import { Prisma } from '@prisma/client';
import { Product } from './product.entity';
import { IProductsService } from './products.service.interface';
import { TYPES } from '../types';
import { IProductsRepository, ProductWithRelations } from './products.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { ProductPurchaseOrAddQuantityDto } from './dto/product-purchase-or-add-quantity.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { DEFAULT_PAGINATION } from '../common/constants';
import { ProductStatus } from '../common/enums/product-status.enum';
import { PrismaService } from '../database/prisma.service';

@injectable()
export class ProductsService implements IProductsService {
	constructor(
		@inject(TYPES.ProductsRepository) private productsRepository: IProductsRepository,
		@inject(TYPES.UsersService) private usersService: IUsersService,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
	) {}

	private async createProductEntity(
		dto: ProductCreateDto,
		creatorId: number,
		status: ProductStatus,
	): Promise<Product> {
		return new Product(
			dto.name,
			dto.description ?? null,
			dto.price,
			dto.quantity,
			dto.sku,
			status,
			creatorId,
			creatorId,
			dto.cityId,
			dto.categoryIds || [],
		);
	}

	private async ensureProductExists(id: number, userId?: number): Promise<ProductWithRelations> {
		return this.productsRepository.findProductByKeyOrThrow(
			'id',
			id,
			userId,
			MESSAGES.PRODUCT_NOT_FOUND,
		);
	}

	private async ensureUniqueSku(sku: string, currentProductId?: number): Promise<void> {
		const existingProduct = await this.productsRepository.findProductByKey(
			'sku',
			sku,
			undefined,
			false,
		);
		if (existingProduct && (!currentProductId || existingProduct.id !== currentProductId)) {
			throw new HTTPError(409, MESSAGES.PRODUCT_SKU_ALREADY_EXISTS);
		}
	}

	private async validateProductRelations(cityId?: number, categoryIds?: number[]): Promise<void> {
		if (cityId) {
			await this.prismaService.validateCity(cityId);
		}
		if (categoryIds?.length) {
			await this.prismaService.validateCategories(categoryIds);
		}
	}

	private validateQuantity(
		quantity: number,
		currentQuantity?: number,
		isPurchase: boolean = false,
	): void {
		if (isPurchase) {
			if (currentQuantity === undefined) {
				throw new HTTPError(422, MESSAGES.PRODUCT_NOT_FOUND);
			}
			if (currentQuantity < quantity) {
				throw new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
			}
		} else if (currentQuantity !== undefined && currentQuantity + quantity < 0) {
			throw new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE);
		}
	}

	private async validateProductAvailability(
		product: ProductWithRelations,
		quantity: number,
		isPurchase: boolean = false,
	): Promise<void> {
		if (product.isDeleted) {
			throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
		}
		if (isPurchase) {
			if (product.quantity === 0) {
				throw new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK);
			}
			if (product.status !== ProductStatus.AVAILABLE) {
				throw new HTTPError(422, MESSAGES.PRODUCT_NOT_ACTIVE);
			}
		}
		this.validateQuantity(quantity, product.quantity, isPurchase);
	}

	async createProduct(
		dto: ProductCreateDto & { userId: number; status: ProductStatus },
	): Promise<ProductWithRelations> {
		await this.ensureUniqueSku(dto.sku);
		await this.validateProductRelations(dto.cityId, dto.categoryIds);
		const product = await this.createProductEntity(dto, dto.userId, dto.status);
		return this.productsRepository.createProduct(product);
	}

	async getProductsByCreator(
		creatorId: number,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<ProductWithRelations>> {
		return this.productsRepository.findProductsByCreator(creatorId, pagination);
	}

	async getAllProducts({
		filters = {},
		pagination = DEFAULT_PAGINATION,
	}: {
		filters?: ProductFilterDto;
		pagination?: PaginationDto;
	} = {}): Promise<PaginatedResponse<ProductWithRelations>> {
		const prismaFilters: Prisma.ProductModelWhereInput = {
			isDeleted: false,
		};

		if (filters.status) {
			prismaFilters.status = filters.status;
		}
		if (filters.cityId) {
			prismaFilters.cityId = filters.cityId;
		}
		if (filters.categoryIds?.length) {
			prismaFilters.categories = { some: { id: { in: filters.categoryIds } } };
		}
		if (filters.name) {
			prismaFilters.name = { contains: filters.name, mode: 'insensitive' };
		}
		if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
			prismaFilters.price = {};
			if (filters.minPrice !== undefined) {
				prismaFilters.price.gte = filters.minPrice;
			}
			if (filters.maxPrice !== undefined) {
				prismaFilters.price.lte = filters.maxPrice;
			}
		}

		const prismaOrderBy: Prisma.ProductModelOrderByWithRelationInput = filters.sortBy
			? { [filters.sortBy]: filters.sortOrder || 'asc' }
			: { createdAt: 'desc' };

		return this.productsRepository.findAllProducts({
			filters: prismaFilters,
			orderBy: prismaOrderBy,
			pagination,
		});
	}

	async getStockProducts(
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<{ id: number; sku: string; quantity: number }>> {
		return this.productsRepository.findStockProducts(pagination);
	}

	async getProductById(id: number): Promise<ProductWithRelations> {
		const product = await this.ensureProductExists(id);
		return product;
	}

	async getProductsForUser(
		telegramId: string,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<ProductWithRelations>> {
		const { page = DEFAULT_PAGINATION.page, limit = DEFAULT_PAGINATION.limit } = pagination;
		const skip = (page - 1) * limit;

		const user = await this.usersService.getUserInfoByTelegramId(telegramId);
		const categoryIds = user!.preferredCategories?.map((c) => c.id) || [];

		const filters: Prisma.ProductModelWhereInput = {
			cityId: user!.cityId,
			isDeleted: false,
			status: ProductStatus.AVAILABLE,
			quantity: { gt: 0 },
			...(categoryIds.length && { categories: { some: { id: { in: categoryIds } } } }),
		};

		const result = await this.productsRepository.findAllProducts({
			filters,
			pagination: { page, limit },
			orderBy: { createdAt: 'asc' },
		});

		return {
			items: result.items,
			total: result.total,
			meta: {
				total: result.total,
				page,
				limit,
				totalPages: Math.ceil(result.total / limit),
			},
		};
	}

	async updateProduct(
		id: number,
		dto: ProductUpdateDto,
		userId: number,
	): Promise<ProductWithRelations> {
		await this.ensureProductExists(id);

		if (dto.sku) {
			await this.ensureUniqueSku(dto.sku, id);
		}

		const data: Prisma.ProductModelUpdateInput = {};
		if (dto.name) data.name = dto.name;
		if (dto.description !== undefined) data.description = dto.description;
		if (dto.price !== undefined) data.price = dto.price;
		if (dto.quantity !== undefined) {
			data.quantity = dto.quantity;
			data.status =
				dto.quantity === 0 ? ProductStatus.OUT_OF_STOCK : dto.status || ProductStatus.AVAILABLE;
		}
		if (dto.sku) data.sku = dto.sku;
		if (dto.status) data.status = dto.status;
		if (dto.cityId !== undefined) {
			data.city = dto.cityId ? { connect: { id: dto.cityId } } : { disconnect: true };
		}
		if (dto.categoryIds) {
			data.categories = { set: dto.categoryIds.map((id) => ({ id })) };
		}

		data.updatedBy = { connect: { id: userId } };

		return this.productsRepository.updateProduct(id, data);
	}

	async updateProductQuantity(
		id: number,
		dto: ProductPurchaseOrAddQuantityDto,
		userId: number,
	): Promise<ProductWithRelations> {
		const product = await this.ensureProductExists(id);
		this.validateQuantity(dto.quantity, product.quantity);
		const newQuantity = product.quantity + dto.quantity;
		const newStatus = newQuantity === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.AVAILABLE;
		return this.productsRepository.updateProduct(id, {
			quantity: newQuantity,
			status: newStatus,
			updatedBy: { connect: { id: userId } },
		});
	}

	async purchaseProduct(
		id: number,
		dto: ProductPurchaseOrAddQuantityDto,
		userId: number,
	): Promise<ProductWithRelations> {
		const product = await this.ensureProductExists(id);
		await this.validateProductAvailability(product, dto.quantity, true);
		const newQuantity = product.quantity - dto.quantity;
		const newStatus = newQuantity === 0 ? ProductStatus.OUT_OF_STOCK : product.status;
		return this.productsRepository.updateProduct(id, {
			quantity: newQuantity,
			status: newStatus,
			updatedBy: { connect: { id: userId } },
		});
	}

	async deleteProduct(id: number): Promise<ProductWithRelations> {
		const product = await this.ensureProductExists(id);
		if (product.status === ProductStatus.AVAILABLE) {
			throw new HTTPError(422, MESSAGES.CANNOT_DELETE_ACTIVE_PRODUCT);
		}
		return this.productsRepository.deleteProduct(id);
	}
}
