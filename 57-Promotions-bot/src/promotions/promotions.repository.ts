import { Prisma } from '@prisma/client';
import { IPromotionsRepository, PromotionWithRelations } from './promotions.repository.interface';
import { Promotion } from './promotion.entity';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MESSAGES } from '../common/messages';
import { DEFAULT_PAGINATION } from '../common/constants';

@injectable()
export class PromotionsRepository implements IPromotionsRepository {
	readonly promotionInclude = {
		categories: { select: { id: true, name: true } },
		city: { select: { id: true, name: true } },
	};

	private readonly promotionSelect = {
		id: true,
		title: true,
		description: true,
		startDate: true,
		endDate: true,
		status: true,
		supplierId: true,
		cityId: true,
		createdAt: true,
		updatedAt: true,
		publicationDate: true,
		imageUrl: true,
		linkUrl: true,
		isDeleted: true,
		...this.promotionInclude,
	};

	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async createPromotion(promotion: Promotion): Promise<PromotionWithRelations> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction(async (prisma) => {
					return prisma.promotionModel.create({
						data: {
							title: promotion.title,
							description: promotion.description,
							startDate: promotion.startDate,
							endDate: promotion.endDate,
							status: promotion.status,
							supplierId: promotion.supplierId,
							cityId: promotion.cityId,
							imageUrl: promotion.imageUrl,
							linkUrl: promotion.linkUrl,
							publicationDate: promotion.publicationDate,
							categories: {
								connect: promotion.categoryIds?.map((id) => ({ id })) || [],
							},
							isDeleted: false,
						},
						include: this.promotionInclude,
					});
				}),
			MESSAGES.PROMOTION_NOT_FOUND,
		);
	}

	async findPromotionByKey(
		key: Extract<keyof PromotionWithRelations, 'title' | 'id'>,
		value: string | number | boolean,
		userId?: number,
		includeDeleted: boolean = false,
	): Promise<PromotionWithRelations | null> {
		return this.prismaService.client.promotionModel.findFirst({
			where: {
				[key]: value,
				...(includeDeleted ? {} : { isDeleted: false }),
				...(userId && { supplierId: userId }),
			},
			include: this.promotionInclude,
		});
	}

	async findPromotionByKeyOrThrow(
		key: Extract<keyof PromotionWithRelations, 'title' | 'id'>,
		value: string | number | boolean,
		userId?: number,
	): Promise<PromotionWithRelations> {
		return this.prismaService.findOrThrow(
			() => this.findPromotionByKey(key, value, userId),
			MESSAGES.PROMOTION_NOT_FOUND,
		);
	}

	async findPromotionsBySupplier(
		supplierId: number,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<PromotionWithRelations>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const [items, total] = await this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction([
					this.prismaService.client.promotionModel.findMany({
						where: { supplierId, isDeleted: false },
						select: this.promotionSelect,
						skip,
						take: limit,
					}),
					this.prismaService.client.promotionModel.count({
						where: { supplierId, isDeleted: false },
					}),
				]),
			MESSAGES.PROMOTION_NOT_FOUND,
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

	async findAllPromotions({
		filters = {},
		orderBy,
		pagination = DEFAULT_PAGINATION,
	}: {
		filters?: Prisma.PromotionModelWhereInput;
		orderBy?: Prisma.PromotionModelOrderByWithRelationInput;
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<PromotionWithRelations>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const combinedFilters: Prisma.PromotionModelWhereInput = {
			...filters,
			isDeleted: false,
		};

		const items = await this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.promotionModel.findMany({
					where: combinedFilters,
					select: this.promotionSelect,
					orderBy,
					skip,
					take: limit,
				}),
			MESSAGES.PROMOTION_NOT_FOUND,
		);

		const total = await this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.promotionModel.count({
					where: combinedFilters,
				}),
			MESSAGES.PROMOTION_NOT_FOUND,
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

	async updatePromotion(
		id: number,
		data: Prisma.PromotionModelUpdateInput,
	): Promise<PromotionWithRelations> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction(async (prisma) => {
					return prisma.promotionModel.update({
						where: { id },
						data,
						include: this.promotionInclude,
					});
				}),
			MESSAGES.PROMOTION_NOT_FOUND,
		);
	}

	async deletePromotion(id: number): Promise<PromotionWithRelations> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.promotionModel.update({
					where: { id },
					data: { isDeleted: true },
					include: this.promotionInclude,
				}),
			MESSAGES.PROMOTION_NOT_FOUND,
		);
	}
}
