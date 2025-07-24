import { Prisma, PromotionModel } from '@prisma/client';
import { Promotion } from './promotion.entity';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

export type PromotionWithRelations = PromotionModel & {
	cityId: number | null;
	city: { id: number; name: string } | null;
	categories: { id: number; name: string }[];
};

export interface IPromotionsRepository {
	promotionInclude: Prisma.PromotionModelInclude;
	createPromotion(promotion: Promotion): Promise<PromotionWithRelations>;
	findPromotionByKey(
		key: Extract<keyof PromotionWithRelations, 'title' | 'id'>,
		value: string | number | boolean,
		userId?: number,
		includeDeleted?: boolean,
	): Promise<PromotionWithRelations | null>;
	findPromotionByKeyOrThrow(
		key: Extract<keyof PromotionWithRelations, 'title' | 'id'>,
		value: string | number | boolean,
		userId?: number,
		errorMessage?: string,
	): Promise<PromotionWithRelations>;
	findPromotionsBySupplier(
		supplierId: number,
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<PromotionWithRelations>>;
	findAllPromotions({
		filters,
		orderBy,
		pagination,
	}: {
		filters?: Prisma.PromotionModelWhereInput;
		orderBy?: Prisma.PromotionModelOrderByWithRelationInput;
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<PromotionWithRelations>>;
	updatePromotion(
		id: number,
		data: Prisma.PromotionModelUpdateInput,
	): Promise<PromotionWithRelations>;
	deletePromotion(id: number): Promise<PromotionWithRelations>;
}
