import { inject, injectable } from 'inversify';
import { ProductModel, Prisma } from '@prisma/client';
import { Product } from './product.entity';
import { IProductsService } from './products.service.interface';
import { TYPES } from '../types';
import { IProductsRepository } from './products.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { ProductPurchaseOrAddQuantityDto } from './dto/product-purchase-or-add-quantity.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { PaginatedResponse, DEFAULT_PAGINATION } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { validateUserExists, validateId } from '../common/validators';

@injectable()
export class ProductsService implements IProductsService {
	constructor(
		@inject(TYPES.ProductsRepository) private productsRepository: IProductsRepository,
		@inject(TYPES.UsersService) private usersService: IUsersService,
	) {}

	async createProduct(dto: ProductCreateDto & { userEmail?: string }): Promise<ProductModel> {
		const user = await validateUserExists(dto.userEmail, this.usersService);
		const existedProduct = await this.productsRepository.findBySku(dto.sku);
		if (existedProduct) {
			throw new HTTPError(422, MESSAGES.SKU_ALREADY_EXISTS);
		}

		const product = new Product(
			dto.name,
			dto.description ?? null,
			dto.price,
			dto.quantity,
			dto.category ?? null,
			dto.sku,
			dto.isActive ?? true,
			dto.isDeleted ?? false,
			user.id,
			user.id,
		);
		return this.productsRepository.create(product);
	}

	async getAllProducts({
		filters = {},
		orderBy,
		pagination = DEFAULT_PAGINATION,
	}: {
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
	} = {}): Promise<PaginatedResponse<ProductModel>> {
		const { page, limit } = pagination;
		if (page <= 0 || limit <= 0) {
			throw new HTTPError(422, MESSAGES.VALIDATION_FAILED);
		}

		const validSortFields = ['name', 'price', 'quantity', 'createdAt', 'updatedAt'];
		if (orderBy?.sortBy && !validSortFields.includes(orderBy.sortBy)) {
			throw new HTTPError(422, MESSAGES.INVALID_SORT_PARAM);
		}

		const prismaFilters: Prisma.ProductModelWhereInput = { isDeleted: false };
		if (filters.name) {
			prismaFilters.name = { contains: filters.name, mode: 'insensitive' };
		}
		if (filters.minPrice || filters.maxPrice) {
			prismaFilters.price = {
				...(filters.minPrice && { gte: filters.minPrice }),
				...(filters.maxPrice && { lte: filters.maxPrice }),
			};
		}
		if (filters.category) {
			prismaFilters.category = filters.category;
		}
		if (filters.isActive !== undefined) {
			prismaFilters.isActive = filters.isActive;
		}
		if (filters.available) {
			prismaFilters.quantity = { gt: 0 };
		}

		const prismaOrderBy: Prisma.ProductModelOrderByWithRelationInput = orderBy?.sortBy
			? { [orderBy.sortBy]: orderBy.sortOrder || 'asc' }
			: { createdAt: 'desc' };

		return this.productsRepository.findAll({
			filters: prismaFilters,
			orderBy: prismaOrderBy,
			pagination,
		});
	}

	async getProductsByCreator(
		userEmail?: string,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<ProductModel>> {
		const user = await validateUserExists(userEmail, this.usersService);
		if (user.role !== 'WAREHOUSE_MANAGER') {
			throw new HTTPError(403, MESSAGES.FORBIDDEN);
		}
		return this.productsRepository.findByCreator(user.id, pagination);
	}

	async getStock(
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<{ id: number; sku: string; quantity: number }>> {
		return this.productsRepository.findStock(pagination);
	}

	async getProductById(id: number, userId: number, role: string): Promise<ProductModel | null> {
    validateId(id);
    const product = await this.productsRepository.findById(
        id,
        role === 'WAREHOUSE_MANAGER' ? userId : undefined,
    );
    if (!product) {
        throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
    }
    return product;
}

	async updateProduct(
		id: number,
		dto: ProductUpdateDto,
		userEmail?: string,
	): Promise<ProductModel> {
		validateId(id);
		const user = await validateUserExists(userEmail, this.usersService);
		await this.productsRepository.findByIdOrThrow(id);

		if (dto.sku) {
			const productBySku = await this.productsRepository.findBySku(dto.sku);
			if (productBySku && productBySku.id !== id) {
				throw new HTTPError(422, MESSAGES.SKU_ALREADY_EXISTS);
			}
		}

		const data: Partial<ProductModel> = {};
		if (dto.name) data.name = dto.name;
		if (dto.description !== undefined) data.description = dto.description;
		if (dto.price !== undefined) data.price = dto.price;
		if (dto.quantity !== undefined) {
			if (dto.quantity < 0) {
				throw new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE);
			}
			data.quantity = dto.quantity;
		}
		if (dto.category !== undefined) data.category = dto.category;
		if (dto.sku) data.sku = dto.sku;
		if (dto.isActive !== undefined) data.isActive = dto.isActive;
		data.updatedById = user.id;

		try {
			return await this.productsRepository.update(id, data);
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
				throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
			}
			throw err;
		}
	}

	async updateProductQuantity(
		id: number,
		dto: ProductPurchaseOrAddQuantityDto,
		userEmail?: string,
	): Promise<ProductModel> {
		validateId(id);
		const user = await validateUserExists(userEmail, this.usersService);
		const product = await this.productsRepository.findByIdOrThrow(id);

		const newQuantity = product.quantity + dto.quantity;
		if (newQuantity < 0) {
			throw new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE);
		}

		try {
			return await this.productsRepository.update(id, {
				quantity: newQuantity,
				updatedById: user.id,
			});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
				throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
			}
			throw err;
		}
	}

	async purchaseProduct(
		id: number,
		dto: ProductPurchaseOrAddQuantityDto,
		userEmail?: string,
	): Promise<ProductModel> {
		validateId(id);
		const user = await validateUserExists(userEmail, this.usersService);
		const product = await this.productsRepository.findByIdOrThrow(id);

		if (!product.isActive) {
			throw new HTTPError(400, MESSAGES.PRODUCT_NOT_ACTIVE);
		}
		if (product.quantity === 0) {
			throw new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK);
		}
		if (product.quantity < dto.quantity) {
			throw new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
		}

		const newQuantity = product.quantity - dto.quantity;
		try {
			return await this.productsRepository.update(id, {
				quantity: newQuantity,
				updatedById: user.id,
			});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
				throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
			}
			throw err;
		}
	}

	async deleteProduct(id: number, userEmail?: string): Promise<ProductModel> {
		validateId(id);
		const user = await validateUserExists(userEmail, this.usersService);
		const product = await this.productsRepository.findByIdOrThrow(id);

		if (!product.isActive) {
			throw new HTTPError(400, MESSAGES.PRODUCT_NOT_ACTIVE);
		}

		return this.productsRepository.delete(id);
	}
}
