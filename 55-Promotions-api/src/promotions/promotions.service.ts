import { inject, injectable } from 'inversify';
import { PromotionModel, Prisma } from '@prisma/client';
import { Promotion } from './promotion.entity';
import { IPromotionsService } from './promotions.service.interface';
import { TYPES } from '../types';
import { IPromotionsRepository } from './promotions.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { PromotionCreateOrProposeDto } from './dto/promotion-create-or-propose.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { PromotionStatus } from '../common/constants';
import { PaginatedResponse, DEFAULT_PAGINATION } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { checkUserExists, validateId } from '../common/validators';

@injectable()
export class PromotionsService implements IPromotionsService {
	constructor(
		@inject(TYPES.PromotionsRepository) private promotionsRepository: IPromotionsRepository,
		@inject(TYPES.UsersService) private usersService: IUsersService,
	) {}

	async createPromotion(
		dto: PromotionCreateOrProposeDto & {
			userEmail?: string;
			status: PromotionStatus;
			supplierId?: number;
		},
	): Promise<PromotionModel> {
		const user = await checkUserExists(dto.userEmail, this.usersService);
		let supplierId = user.id;
		if (dto.supplierId && dto.status === 'APPROVED') {
			validateId(dto.supplierId);
			const supplier = await this.usersService.getUserInfoById(dto.supplierId);
			if (!supplier) {
				throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
			}
			supplierId = dto.supplierId;
		}
		if (dto.status === 'PENDING' && new Date(dto.startDate) <= new Date()) {
			throw new HTTPError(422, MESSAGES.PAST_START_DATE);
		}
		const promotion = new Promotion(
			dto.title,
			dto.description,
			new Date(dto.startDate),
			new Date(dto.endDate),
			dto.status,
			supplierId,
		);
		return this.promotionsRepository.createPromotion(promotion);
	}

	async getPromotionsBySupplier(
		email?: string,
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<PromotionModel>> {
		const user = await checkUserExists(email, this.usersService);
		if (user.role !== 'SUPPLIER') {
			throw new HTTPError(403, MESSAGES.FORBIDDEN);
		}
		return this.promotionsRepository.findBySupplier(user.id, pagination);
	}

	async getAllPromotions({
		filters = {},
		orderBy,
		pagination = DEFAULT_PAGINATION,
	}: {
		filters?: { status?: PromotionStatus; active?: string };
		orderBy?: { sortBy?: string; sortOrder?: string };
		pagination?: PaginationDto;
	} = {}): Promise<PaginatedResponse<PromotionModel>> {
		const validSortFields = ['createdAt', 'title', 'startDate', 'endDate', 'status'];
		if (orderBy?.sortBy && !validSortFields.includes(orderBy.sortBy)) {
			throw new HTTPError(422, MESSAGES.INVALID_SORT_PARAM);
		}

		const prismaFilters: Prisma.PromotionModelWhereInput = {
			isDeleted: false,
		};
		if (filters.status) {
			prismaFilters.status = filters.status;
		}
		if (filters.active === 'true') {
			prismaFilters.endDate = { gte: new Date() };
		} else if (filters.active === 'false') {
			prismaFilters.endDate = { lt: new Date() };
		}

		const prismaOrderBy: Prisma.PromotionModelOrderByWithRelationInput = orderBy?.sortBy
			? { [orderBy.sortBy]: orderBy.sortOrder || 'asc' }
			: { createdAt: 'desc' };

		return this.promotionsRepository.findAllPromotions({
			filters: prismaFilters,
			orderBy: prismaOrderBy,
			pagination,
		});
	}

	async getPromotionById(id: number, userId: number, role: string): Promise<PromotionModel | null> {
		validateId(id);
		const promotion = await this.promotionsRepository.findById(
			id,
			role === 'SUPPLIER' ? userId : undefined,
		);
		if (!promotion) {
			throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
		}
		return promotion;
	}

	async updatePromotion(id: number, dto: PromotionUpdateDto): Promise<PromotionModel> {
		validateId(id);
		if (dto.startDate && dto.endDate) {
			const start = new Date(dto.startDate);
			const end = new Date(dto.endDate);
			if (start >= end) {
				throw new HTTPError(422, MESSAGES.INVALID_DATES);
			}
		}
		const data: Partial<PromotionModel> = {};
		if (dto.title) data.title = dto.title;
		if (dto.description !== undefined) data.description = dto.description;
		if (dto.startDate) data.startDate = new Date(dto.startDate);
		if (dto.endDate) data.endDate = new Date(dto.endDate);
		return await this.promotionsRepository.updatePromotion(id, data);
	}

	async updatePromotionStatus(id: number, status: PromotionStatus): Promise<PromotionModel> {
		validateId(id);
		return await this.promotionsRepository.updatePromotion(id, { status });
	}

	async deletePromotion(id: number): Promise<PromotionModel> {
		validateId(id);
		const promotion = await this.promotionsRepository.findByIdOrThrow(id);
		const now = new Date();
		if (promotion.status === 'APPROVED' && promotion.startDate <= now && promotion.endDate >= now) {
			throw new HTTPError(400, MESSAGES.CANNOT_DELETE_ACTIVE_PROMOTION);
		}
		return this.promotionsRepository.deletePromotion(id);
	}
}
