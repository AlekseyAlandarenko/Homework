import { PromotionModel } from '@prisma/client';
import { PromotionCreateOrProposeDto } from './dto/promotion-create-or-propose.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import { PromotionStatus } from '../common/constants';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

export interface IPromotionsService {
	createPromotion(
		dto: PromotionCreateOrProposeDto & {
			userEmail?: string;
			status: PromotionStatus;
			supplierId?: number;
		},
	): Promise<PromotionModel>;
	getPromotionsBySupplier(
		email?: string,
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<PromotionModel>>;
	getAllPromotions(params?: {
		filters?: {
			status?: PromotionStatus;
			active?: string;
		};
		orderBy?: {
			sortBy?: string;
			sortOrder?: string;
		};
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<PromotionModel>>;
	getPromotionById(id: number, userId: number, role: string): Promise<PromotionModel | null>;
	updatePromotion(id: number, dto: PromotionUpdateDto): Promise<PromotionModel>;
	updatePromotionStatus(id: number, status: PromotionStatus): Promise<PromotionModel>;
	deletePromotion(id: number): Promise<PromotionModel>;
}
