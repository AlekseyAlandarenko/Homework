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
	}: {
		filters?: Prisma.PromotionModelWhereInput;
		orderBy?: Prisma.PromotionModelOrderByWithRelationInput;
	} = {}): Promise<PromotionModel[]> {
		return this.prismaService.client.promotionModel.findMany({
			where: filters,
			orderBy,
		});
	}

	async findBySupplier(supplierId: number): Promise<PromotionModel[]> {
		return this.prismaService.client.promotionModel.findMany({
			where: {
				supplierId,
			},
		});
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
