import { PromotionModel, PromotionStatus } from '@prisma/client';
import { PromotionCreateOrProposeDto } from './dto/promotion-create-or-propose.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';

export interface IPromotionsService {
	createPromotion(
		dto: PromotionCreateOrProposeDto & { userEmail?: string; status: string; supplierId?: number },
	): Promise<PromotionModel>;
	getAllPromotions(params?: {
		filters?: { status?: string; active?: string };
		orderBy?: { sortBy?: string; sortOrder?: string };
	}): Promise<PromotionModel[]>;
	getPromotionsBySupplier(email?: string): Promise<PromotionModel[]>;
	updatePromotion(id: number, dto: PromotionUpdateDto): Promise<PromotionModel>;
	updatePromotionStatus(id: number, status: PromotionStatus): Promise<PromotionModel>;
	deletePromotion(id: number): Promise<PromotionModel>;
}
