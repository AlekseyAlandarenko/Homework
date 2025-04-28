import { Prisma, PromotionModel, PromotionStatus } from '@prisma/client';
import { IPromotionsRepository } from './promotions.repository.interface';
import { Promotion } from './promotion.entity';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';

@injectable()
export class PromotionsRepository implements IPromotionsRepository {
  constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

  async create({
    title,
    description,
    startDate,
    endDate,
    status,
    supplierId,
  }: Promotion): Promise<PromotionModel> {
    return this.prismaService.client.promotionModel.create({
      data: {
        title,
        description,
        startDate,
        endDate,
        status: status as PromotionStatus,
        supplierId,
      },
    });
  }

  async findAll({
    filters = {},
    orderBy,
    pagination = { page: 1, limit: 10 },
  }: {
    filters?: Prisma.PromotionModelWhereInput;
    orderBy?: Prisma.PromotionModelOrderByWithRelationInput;
    pagination?: { page: number; limit: number };
  } = {}): Promise<{ items: PromotionModel[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const [items, total] = await Promise.all([
      this.prismaService.client.promotionModel.findMany({
        where: filters,
        orderBy,
        skip,
        take: pagination.limit,
      }),
      this.prismaService.client.promotionModel.count({
        where: filters,
      }),
    ]);
    return { items, total };
  }

  async findBySupplier(
    supplierId: number,
    pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ): Promise<{ items: PromotionModel[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    const [items, total] = await Promise.all([
      this.prismaService.client.promotionModel.findMany({
        where: {
          supplierId,
        },
        skip,
        take: pagination.limit,
      }),
      this.prismaService.client.promotionModel.count({
        where: {
          supplierId,
        },
      }),
    ]);
    return { items, total };
  }

  async update(id: number, data: Partial<PromotionModel>): Promise<PromotionModel | null> {
    return this.prismaService.client.promotionModel.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<PromotionModel | null> {
    return this.prismaService.client.promotionModel.delete({
      where: { id },
    });
  }
}