import { PromotionModel, Prisma } from '@prisma/client';
import { Promotion } from './promotion.entity';

export interface IPromotionsRepository {
	create(promotion: Promotion): Promise<PromotionModel>;
	findAll(params?: {
		filters?: Prisma.PromotionModelWhereInput;
		orderBy?: Prisma.PromotionModelOrderByWithRelationInput;
	}): Promise<PromotionModel[]>;
	findBySupplier(supplierId: number): Promise<PromotionModel[]>;
	update(id: number, data: Partial<PromotionModel>): Promise<PromotionModel | null>;
	delete(id: number): Promise<PromotionModel | null>;
}
