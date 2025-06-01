import { Prisma, ProductModel } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { Product } from './product.entity';
import { IProductsRepository } from './products.repository.interface';
import { TYPES } from '../types';
import { PaginatedResponse, DEFAULT_PAGINATION } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

@injectable()
export class ProductsRepository implements IProductsRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async create(product: Product): Promise<ProductModel> {
		return this.prismaService.client.productModel.create({
			data: {
				name: product.name,
				description: product.description,
				price: product.price,
				quantity: product.quantity,
				category: product.category,
				sku: product.sku,
				isActive: product.isActive,
				isDeleted: product.isDeleted,
				createdById: product.createdById,
				updatedById: product.updatedById,
			},
		});
	}

	async findById(id: number, userId?: number): Promise<ProductModel | null> {
		return this.prismaService.client.productModel.findFirst({
			where: {
				id,
				isDeleted: false,
				...(userId && { supplierId: userId }),
			},
		});
	}

	async findByIdOrThrow(id: number): Promise<ProductModel> {
		const product = await this.findById(id);
		if (!product) {
			throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
		}
		return product;
	}

	async findBySku(sku: string): Promise<ProductModel | null> {
		return this.prismaService.client.productModel.findFirst({
			where: { sku, isDeleted: false },
		});
	}

	async findAll({
		filters = { isDeleted: false },
		orderBy = { createdAt: 'desc' },
		pagination = DEFAULT_PAGINATION,
	}: {
		filters?: Prisma.ProductModelWhereInput;
		orderBy?: Prisma.ProductModelOrderByWithRelationInput;
		pagination?: PaginationDto;
	} = {}): Promise<PaginatedResponse<ProductModel>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.prismaService.client.productModel.findMany({
				where: filters,
				skip,
				take: limit,
				orderBy,
			}),
			this.prismaService.client.productModel.count({ where: filters }),
		]);

		return { items, total };
	}

	async findStock(
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<{ id: number; sku: string; quantity: number }>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.prismaService.client.productModel.findMany({
				where: { isDeleted: false, isActive: true },
				skip,
				take: limit,
				select: { id: true, sku: true, quantity: true },
			}),
			this.prismaService.client.productModel.count({
				where: { isDeleted: false, isActive: true },
			}),
		]);

		return { items, total };
	}

	async findByCreator(
		creatorId: number,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<ProductModel>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.prismaService.client.productModel.findMany({
				where: { createdById: creatorId, isDeleted: false, isActive: true },
				skip,
				take: limit,
			}),
			this.prismaService.client.productModel.count({
				where: { createdById: creatorId, isDeleted: false, isActive: true },
			}),
		]);

		return { items, total };
	}

	async update(id: number, data: Partial<ProductModel>): Promise<ProductModel> {
		try {
			return await this.prismaService.client.productModel.update({
				where: { id },
				data: { ...data, isDeleted: false },
			});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
				throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
			}
			throw err;
		}
	}

	async delete(id: number): Promise<ProductModel> {
		try {
			return await this.prismaService.client.productModel.update({
				where: { id },
				data: { isDeleted: true },
			});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
				throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
			}
			throw err;
		}
	}
}
