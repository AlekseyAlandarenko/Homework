import { Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { Product } from './product.entity';
import { IProductsRepository, ProductWithRelations } from './products.repository.interface';
import { TYPES } from '../types';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MESSAGES } from '../common/messages';
import { DEFAULT_PAGINATION } from '../common/constants';
import { ProductStatus } from '../common/enums/product-status.enum';

@injectable()
export class ProductsRepository implements IProductsRepository {
	readonly productInclude = {
		categories: { select: { id: true, name: true } },
		city: { select: { id: true, name: true } },
		options: { select: { id: true, name: true, value: true, priceModifier: true } },
	};

	private readonly productSelect = {
		id: true,
		name: true,
		description: true,
		price: true,
		quantity: true,
		sku: true,
		status: true,
		createdById: true,
		updatedById: true,
		cityId: true,
		createdAt: true,
		updatedAt: true,
		isActive: true,
		isDeleted: true,
		...this.productInclude,
	};

	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async createProduct(product: Product): Promise<ProductWithRelations> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction(async (prisma) => {
					return prisma.productModel.create({
						data: {
							name: product.name,
							description: product.description,
							price: product.price,
							quantity: product.quantity,
							sku: product.sku,
							status: product.status,
							createdById: product.createdById,
							updatedById: product.updatedById,
							cityId: product.cityId,
							categories: {
								connect: product.categoryIds?.map((id) => ({ id })) || [],
							},
							options: {
								create:
									product.options?.map((opt) => ({
										name: opt.name,
										value: opt.value,
										priceModifier: opt.priceModifier,
									})) || [],
							},
							isDeleted: product.isDeleted,
						},
						include: this.productInclude,
					});
				}),
			MESSAGES.PRODUCT_NOT_FOUND,
		);
	}

	async findProductByKey(
		key: Extract<keyof ProductWithRelations, 'name' | 'sku' | 'id'>,
		value: string | number | boolean,
		userId?: number,
		includeDeleted: boolean = false,
	): Promise<ProductWithRelations | null> {
		return this.prismaService.client.productModel.findFirst({
			where: {
				[key]: value,
				...(includeDeleted ? {} : { isDeleted: false }),
				...(userId && { createdById: userId }),
			},
			include: this.productInclude,
		});
	}

	async findProductByKeyOrThrow(
		key: Extract<keyof ProductWithRelations, 'name' | 'sku' | 'id'>,
		value: string | number | boolean,
		userId?: number,
	): Promise<ProductWithRelations> {
		return this.prismaService.findOrThrow(
			() => this.findProductByKey(key, value, userId),
			MESSAGES.PRODUCT_NOT_FOUND,
		);
	}

	async findProductsByCreator(
		creatorId: number,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<ProductWithRelations>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const [items, total] = await this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction([
					this.prismaService.client.productModel.findMany({
						where: { createdById: creatorId, isDeleted: false },
						select: this.productSelect,
						skip,
						take: limit,
					}),
					this.prismaService.client.productModel.count({
						where: { createdById: creatorId, isDeleted: false },
					}),
				]),
			MESSAGES.PRODUCT_NOT_FOUND,
		);

		const totalPages = Math.ceil(total / limit);

		return {
			items,
			total,
			meta: {
				total,
				page,
				limit,
				totalPages,
			},
		};
	}

	async findAllProducts({
		filters = {},
		orderBy,
		pagination = DEFAULT_PAGINATION,
	}: {
		filters?: Prisma.ProductModelWhereInput;
		orderBy?: Prisma.ProductModelOrderByWithRelationInput;
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<ProductWithRelations>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const combinedFilters: Prisma.ProductModelWhereInput = {
			...filters,
			isDeleted: false,
		};

		const [items, total] = await this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction([
					this.prismaService.client.productModel.findMany({
						where: combinedFilters,
						select: this.productSelect,
						orderBy,
						skip,
						take: limit,
					}),
					this.prismaService.client.productModel.count({
						where: combinedFilters,
					}),
				]),
			MESSAGES.PRODUCT_NOT_FOUND,
		);

		const totalPages = Math.ceil(total / limit);

		return {
			items,
			total,
			meta: {
				total,
				page,
				limit,
				totalPages,
			},
		};
	}

	async findStockProducts(
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<{ id: number; sku: string; quantity: number }>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const [items, total] = await this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction([
					this.prismaService.client.productModel.findMany({
						where: { isDeleted: false, status: ProductStatus.AVAILABLE },
						skip,
						take: limit,
						select: { id: true, sku: true, quantity: true },
					}),
					this.prismaService.client.productModel.count({
						where: { isDeleted: false, status: ProductStatus.AVAILABLE },
					}),
				]),
			MESSAGES.PRODUCT_NOT_FOUND,
		);

		const totalPages = Math.ceil(total / limit);

		return {
			items,
			total,
			meta: {
				total,
				page,
				limit,
				totalPages,
			},
		};
	}

	async updateProduct(
		id: number,
		data: Prisma.ProductModelUpdateInput,
	): Promise<ProductWithRelations> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction(async (prisma) => {
					return prisma.productModel.update({
						where: { id },
						data,
						include: this.productInclude,
					});
				}),
			MESSAGES.PRODUCT_NOT_FOUND,
		);
	}

	async updateProductCreator(currentCreatorId: number, newCreatorId: number): Promise<void> {
		await this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.productModel.updateMany({
					where: { createdById: currentCreatorId, isDeleted: false },
					data: { createdById: newCreatorId },
				}),
			MESSAGES.PRODUCT_NOT_FOUND,
		);
	}

	async deleteProduct(id: number): Promise<ProductWithRelations> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.productModel.update({
					where: { id },
					data: { isDeleted: true },
					include: this.productInclude,
				}),
			MESSAGES.PRODUCT_NOT_FOUND,
		);
	}
}
