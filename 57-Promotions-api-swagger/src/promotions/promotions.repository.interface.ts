import { PromotionModel, Prisma } from '@prisma/client';
import { Promotion } from './promotion.entity';

export interface IPromotionsRepository {
  create(promotion: Promotion): Promise<PromotionModel>;
  findAll(params?: {
    filters?: Prisma.PromotionModelWhereInput;
    orderBy?: Prisma.PromotionModelOrderByWithRelationInput;
    pagination?: { page?: number; limit?: number };
  }): Promise<{ items: PromotionModel[]; total: number }>;
  findBySupplier(
    supplierId: number,
    pagination?: { page?: number; limit?: number },
  ): Promise<{ items: PromotionModel[]; total: number }>;
  update(id: number, data: Partial<PromotionModel>): Promise<PromotionModel | null>;
  delete(id: number): Promise<PromotionModel | null>;
}
