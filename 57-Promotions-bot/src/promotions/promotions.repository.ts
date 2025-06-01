import { Prisma, PromotionModel } from '@prisma/client';
import { IPromotionsRepository } from './promotions.repository.interface';
import { Promotion } from './promotion.entity';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';
import { PaginatedResponse, DEFAULT_PAGINATION } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

@injectable()
export class PromotionsRepository implements IPromotionsRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async createPromotion({
		title,
		description,
		startDate,
		endDate,
		status,
		supplierId,
	}: Promotion): Promise<PromotionModel> {
		return this.prismaService.client.promotionModel.create({
			data: {
				title,
				description,
				startDate,
				endDate,
				status,
				supplierId,
			},
		});
	}

	async findById(id: number, userId?: number): Promise<PromotionModel | null> {
		return this.prismaService.client.promotionModel.findFirst({
			where: {
				id,
				isDeleted: false,
				...(userId && { supplierId: userId }),
			},
		});
	}

	async findByIdOrThrow(id: number): Promise<PromotionModel> {
		const promotion = await this.findById(id);
		if (!promotion) {
			throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
		}
		return promotion;
	}

	async findBySupplier(
		supplierId: number,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<PromotionModel>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.prismaService.client.promotionModel.findMany({
				where: { supplierId, isDeleted: false },
				skip,
				take: limit,
			}),
			this.prismaService.client.promotionModel.count({
				where: { supplierId, isDeleted: false },
			}),
		]);
		return { items, total };
	}

	async findAllPromotions({
		filters = {},
		orderBy,
		pagination = DEFAULT_PAGINATION,
	}: {
		filters?: Prisma.PromotionModelWhereInput;
		orderBy?: Prisma.PromotionModelOrderByWithRelationInput;
		pagination?: PaginationDto;
	} = {}): Promise<PaginatedResponse<PromotionModel>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const combinedFilters: Prisma.PromotionModelWhereInput = {
			...filters,
			isDeleted: false,
		};

		const [items, total] = await Promise.all([
			this.prismaService.client.promotionModel.findMany({
				where: combinedFilters,
				orderBy,
				skip,
				take: limit,
			}),
			this.prismaService.client.promotionModel.count({
				where: combinedFilters,
			}),
		]);
		return { items, total };
	}

	async updatePromotion(id: number, data: Partial<PromotionModel>): Promise<PromotionModel> {
		try {
			return await this.prismaService.client.promotionModel.update({
				where: { id },
				data: { ...data, isDeleted: false },
			});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
				throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
			}
			throw err;
		}
	}

	async deletePromotion(id: number): Promise<PromotionModel> {
		try {
			return await this.prismaService.client.promotionModel.update({
				where: { id },
				data: { isDeleted: true },
			});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
				throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
			}
			throw err;
		}
	}
}
