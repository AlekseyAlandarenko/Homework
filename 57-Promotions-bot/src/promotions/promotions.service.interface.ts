import { PromotionCreateOrProposeDto } from './dto/promotion-create-or-propose.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PromotionsFilterDto } from './dto/promotion-filter.dto';
import { PromotionStatus } from '../common/enums/promotion-status.enum';
import { Role } from '../common/enums/role.enum';
import { PromotionWithRelations } from './promotions.repository.interface';

export interface IPromotionsService {
	createPromotion(
		dto: PromotionCreateOrProposeDto & {
			status: PromotionStatus;
			supplierId: number;
		},
	): Promise<PromotionWithRelations>;
	getPromotionsBySupplier(
		supplierId: number,
		pagination?: PaginationDto,
	): Promise<PaginatedResponse<PromotionWithRelations>>;
	getAllPromotions({
		filters,
		pagination,
	}: {
		filters?: PromotionsFilterDto;
		pagination?: PaginationDto;
	}): Promise<PaginatedResponse<PromotionWithRelations>>;
	getPromotionById(id: number, userId?: number, userRole?: Role): Promise<PromotionWithRelations>;
	getPromotionsForUser(
		telegramId: string,
		pagination: PaginationDto,
	): Promise<PaginatedResponse<PromotionWithRelations>>;
	updatePromotion(id: number, dto: PromotionUpdateDto): Promise<PromotionWithRelations>;
	updatePromotionStatus(id: number, status: PromotionStatus): Promise<PromotionWithRelations>;
	deletePromotion(id: number): Promise<PromotionWithRelations>;
}
