import { PromotionModel, Prisma } from '@prisma/client';
import { Promotion } from './promotion.entity';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

export interface IPromotionsRepository {
	createPromotion(promotion: Promotion): Promise<PromotionModel>;
	findById(id: number, userId?: number): Promise<PromotionModel | null>;
	findByIdOrThrow(id: number): Promise<PromotionModel>;
	findBySupplier(
		supplierId: number,
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<PromotionModel>>;
	findAllPromotions(params?: {
		filters?: Prisma.PromotionModelWhereInput;
		orderBy?: Prisma.PromotionModelOrderByWithRelationInput;
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<PromotionModel>>;
	updatePromotion(id: number, data: Partial<PromotionModel>): Promise<PromotionModel>;
	deletePromotion(id: number): Promise<PromotionModel>;
}
