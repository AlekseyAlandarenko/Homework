import { inject, injectable } from 'inversify';
import { Prisma } from '@prisma/client';
import { Promotion } from './promotion.entity';
import { IPromotionsService } from './promotions.service.interface';
import { TYPES } from '../types';
import { IPromotionsRepository, PromotionWithRelations } from './promotions.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { PromotionCreateOrProposeDto } from './dto/promotion-create-or-propose.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PromotionsFilterDto } from './dto/promotion-filter.dto';
import { DEFAULT_PAGINATION } from '../common/constants';
import { PromotionStatus } from '../common/enums/promotion-status.enum';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../database/prisma.service';

@injectable()
export class PromotionsService implements IPromotionsService {
	constructor(
		@inject(TYPES.PromotionsRepository) private promotionsRepository: IPromotionsRepository,
		@inject(TYPES.UsersService) private usersService: IUsersService,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
	) {}

	private async createPromotionEntity(
		dto: PromotionCreateOrProposeDto,
		supplierId: number,
		status: PromotionStatus,
	): Promise<Promotion> {
		return new Promotion(
			dto.title,
			dto.description,
			new Date(dto.startDate),
			new Date(dto.endDate),
			status,
			supplierId,
			dto.cityId,
			dto.categoryIds || [],
		);
	}

	private async ensurePromotionExists(
		id: number,
		userId?: number,
	): Promise<PromotionWithRelations> {
		return this.promotionsRepository.findPromotionByKeyOrThrow(
			'id',
			id,
			userId,
			MESSAGES.PROMOTION_NOT_FOUND,
		);
	}

	private async ensureUniqueTitle(title: string, currentPromotionId?: number): Promise<void> {
		const existingPromotion = await this.promotionsRepository.findPromotionByKey('title', title);
		if (existingPromotion && (!currentPromotionId || existingPromotion.id !== currentPromotionId)) {
			throw new HTTPError(409, MESSAGES.PROMOTION_TITLE_ALREADY_EXISTS);
		}
	}

	private async validatePromotionRelations(cityId?: number, categoryIds?: number[]): Promise<void> {
		if (cityId) {
			await this.prismaService.validateCity(cityId);
		}
		if (categoryIds?.length) {
			await this.prismaService.validateCategories(categoryIds);
		}
	}

	async createPromotion(
		dto: PromotionCreateOrProposeDto & {
			status: PromotionStatus;
			supplierId: number;
		},
	): Promise<PromotionWithRelations> {
		const supplier = await this.usersService.getUserInfoById(dto.supplierId);
		if (!supplier) {
			throw new HTTPError(404, MESSAGES.SUPPLIER_NOT_FOUND);
		}
		if (supplier.role !== Role.SUPPLIER) {
			throw new HTTPError(403, MESSAGES.INVALID_SUPPLIER_ROLE);
		}

		await this.ensureUniqueTitle(dto.title);
		await this.validatePromotionRelations(dto.cityId, dto.categoryIds);
		const promotion = await this.createPromotionEntity(dto, dto.supplierId, dto.status);
		return this.promotionsRepository.createPromotion(promotion);
	}

	async getPromotionsBySupplier(
		supplierId: number,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<PromotionWithRelations>> {
		return this.promotionsRepository.findPromotionsBySupplier(supplierId, pagination);
	}

	async getAllPromotions({
		filters = {},
		pagination = DEFAULT_PAGINATION,
	}: {
		filters?: PromotionsFilterDto;
		pagination?: PaginationDto;
	} = {}): Promise<PaginatedResponse<PromotionWithRelations>> {
		const prismaFilters: Prisma.PromotionModelWhereInput = {
			isDeleted: false,
		};

		if (filters.cityId) {
			await this.prismaService.validateCity(filters.cityId);
			prismaFilters.cityId = filters.cityId;
		}
		if (filters.categoryIds?.length) {
			await this.prismaService.validateCategories(filters.categoryIds);
			prismaFilters.categories = { some: { id: { in: filters.categoryIds } } };
		}
		if (filters.status) {
			prismaFilters.status = filters.status;
		}
		if (filters.active === true) {
			prismaFilters.AND = [
				{ startDate: { lte: new Date() } },
				{ endDate: { gte: new Date() } },
				{ status: PromotionStatus.APPROVED },
			];
		} else if (filters.active === false) {
			prismaFilters.OR = [
				{ startDate: { gt: new Date() } },
				{ endDate: { lt: new Date() } },
				{ status: { not: PromotionStatus.APPROVED } },
			];
		}

		const prismaOrderBy: Prisma.PromotionModelOrderByWithRelationInput = filters.sortBy
			? { [filters.sortBy]: filters.sortOrder || 'asc' }
			: { createdAt: 'desc' };

		return this.promotionsRepository.findAllPromotions({
			filters: prismaFilters,
			orderBy: prismaOrderBy,
			pagination,
		});
	}

	async getPromotionById(
		id: number,
		userId: number,
		userRole: Role,
	): Promise<PromotionWithRelations> {
		const promotion = await this.ensurePromotionExists(
			id,
			userRole === Role.SUPPLIER ? userId : undefined,
		);
		if (userRole === Role.SUPPLIER && promotion.supplierId !== userId) {
			throw new HTTPError(403, MESSAGES.FORBIDDEN_ACCESS_TO_PROMOTION);
		}
		return promotion;
	}

	async getPromotionsForUser(
		telegramId: string,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<PromotionWithRelations>> {
		const { page = DEFAULT_PAGINATION.page, limit = DEFAULT_PAGINATION.limit } = pagination;
		const skip = (page - 1) * limit;

		const user = await this.usersService.getUserInfoByTelegramId(telegramId);
		const categoryIds = user!.preferredCategories?.map((c) => c.id) || [];

		const filters: Prisma.PromotionModelWhereInput = {
			cityId: user!.cityId,
			isDeleted: false,
			status: PromotionStatus.APPROVED,
			startDate: { lte: new Date() },
			endDate: { gte: new Date() },
			...(categoryIds.length && { categories: { some: { id: { in: categoryIds } } } }),
		};

		const result = await this.promotionsRepository.findAllPromotions({
			filters,
			pagination: { page, limit },
			orderBy: { startDate: 'asc' },
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

	async updatePromotion(id: number, dto: PromotionUpdateDto): Promise<PromotionWithRelations> {
		await this.ensurePromotionExists(id);

		if (dto.title) {
			await this.ensureUniqueTitle(dto.title, id);
		}
		await this.validatePromotionRelations(dto.cityId, dto.categoryIds);

		const data: Prisma.PromotionModelUpdateInput = {};
		if (dto.title) data.title = dto.title;
		if (dto.description !== undefined) data.description = dto.description;
		if (dto.startDate) data.startDate = new Date(dto.startDate);
		if (dto.endDate) data.endDate = new Date(dto.endDate);
		if (dto.cityId !== undefined) {
			data.city = dto.cityId ? { connect: { id: dto.cityId } } : { disconnect: true };
		}
		if (dto.categoryIds) {
			data.categories = { set: dto.categoryIds.map((id) => ({ id })) };
		}

		return this.promotionsRepository.updatePromotion(id, data);
	}

	async updatePromotionStatus(
		id: number,
		status: PromotionStatus,
	): Promise<PromotionWithRelations> {
		await this.ensurePromotionExists(id);
		return this.promotionsRepository.updatePromotion(id, { status });
	}

	async deletePromotion(id: number): Promise<PromotionWithRelations> {
		const promotion = await this.ensurePromotionExists(id);
		const now = new Date();
		if (
			promotion.status === PromotionStatus.APPROVED &&
			promotion.startDate <= now &&
			now <= promotion.endDate
		) {
			throw new HTTPError(422, MESSAGES.CANNOT_DELETE_ACTIVE_PROMOTION);
		}
		return this.promotionsRepository.deletePromotion(id);
	}
}
