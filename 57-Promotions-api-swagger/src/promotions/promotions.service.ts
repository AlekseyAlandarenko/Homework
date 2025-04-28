import { inject, injectable } from 'inversify';
import { PromotionModel, PromotionStatus, Prisma } from '@prisma/client';
import { Promotion } from './promotion.entity';
import { IPromotionsService } from './promotions.service.interface';
import { TYPES } from '../types';
import { IPromotionsRepository } from './promotions.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { PromotionCreateOrProposeDto } from './dto/promotion-create-or-propose.dto';
import { PromotionUpdateDto } from './dto/promotion-update.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

@injectable()
export class PromotionsService implements IPromotionsService {
  constructor(
    @inject(TYPES.PromotionsRepository) private promotionsRepository: IPromotionsRepository,
    @inject(TYPES.UsersService) private usersService: IUsersService,
  ) {}

  private handleError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
    }
    throw err instanceof HTTPError ? err : new HTTPError(500, MESSAGES.SERVER_ERROR);
  }

  private validatePromotionDates(startDate?: string, endDate?: string): void {
    if (startDate) {
      const now = new Date();
      if (new Date(startDate) < now) {
        throw new HTTPError(422, MESSAGES.PAST_START_DATE);
      }
    }
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      throw new HTTPError(422, MESSAGES.INVALID_DATES);
    }
  }

  async createPromotion(
    dto: PromotionCreateOrProposeDto & { userEmail?: string; status: string; supplierId?: number },
  ): Promise<PromotionModel> {
    try {
      if (!dto.userEmail) {
        throw new HTTPError(401, MESSAGES.UNAUTHORIZED);
      }
      const user = await this.usersService.getUserInfo(dto.userEmail);
      if (!user) {
        throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
      }
      const supplierId = dto.supplierId || user.id;
      const supplier = await this.usersService.getUserInfoById(supplierId);
      if (!supplier || supplier.role !== 'SUPPLIER') {
        throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
      }

      this.validatePromotionDates(dto.startDate, dto.endDate);

      const promotion = new Promotion(
        dto.title,
        dto.description,
        new Date(dto.startDate),
        new Date(dto.endDate),
        dto.status as PromotionStatus,
        supplierId,
      );
      return await this.promotionsRepository.create(promotion);
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getAllPromotions({
    filters = {},
    orderBy,
    pagination = { page: 1, limit: 10 },
  }: {
    filters?: { status?: string; active?: string };
    orderBy?: { sortBy?: string; sortOrder?: string };
    pagination?: { page: number; limit: number };
  } = {}): Promise<{ items: PromotionModel[]; total: number }> {
    try {
      const validSortFields = ['createdAt', 'title', 'startDate', 'endDate', 'status'];

      if (orderBy?.sortBy && !validSortFields.includes(orderBy.sortBy)) {
        throw new HTTPError(422, MESSAGES.INVALID_SORT_PARAM);
      }
      if (pagination.page < 1 || pagination.limit < 1) {
        throw new HTTPError(422, MESSAGES.VALIDATION_FAILED);
      }

      const prismaFilters: any = {};
      if (filters.status) prismaFilters.status = filters.status as PromotionStatus;
      if (filters.active === 'true') {
        prismaFilters.endDate = { gte: new Date() };
      } else if (filters.active === 'false') {
        prismaFilters.endDate = { lt: new Date() };
      }
      const prismaOrderBy = orderBy?.sortBy
        ? { [orderBy.sortBy]: orderBy.sortOrder === 'desc' ? 'desc' : 'asc' }
        : undefined;

      return await this.promotionsRepository.findAll({
        filters: prismaFilters,
        orderBy: prismaOrderBy,
        pagination,
      });
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getPromotionsBySupplier(
    email?: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ): Promise<{ items: PromotionModel[]; total: number }> {
    try {
      if (!email) {
        throw new HTTPError(401, MESSAGES.UNAUTHORIZED);
      }
      const user = await this.usersService.getUserInfo(email);
      if (!user) {
        throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
      }
      if (user.role !== 'SUPPLIER') {
        throw new HTTPError(403, MESSAGES.SUPPLIER_ONLY);
      }
      if (pagination.page < 1 || pagination.limit < 1) {
        throw new HTTPError(422, MESSAGES.VALIDATION_FAILED);
      }
      return await this.promotionsRepository.findBySupplier(user.id, pagination);
    } catch (err) {
      return this.handleError(err);
    }
  }

  async updatePromotion(id: number, dto: PromotionUpdateDto): Promise<PromotionModel> {
    try {
      if (isNaN(id)) {
        throw new HTTPError(400, MESSAGES.INVALID_FORMAT);
      }
      if (Object.keys(dto).length === 0) {
        throw new HTTPError(422, MESSAGES.VALIDATION_FAILED);
      }
      this.validatePromotionDates(dto.startDate, dto.endDate);

      const data: Partial<PromotionModel> = {};
      if (dto.title) data.title = dto.title;
      if (dto.description) data.description = dto.description;
      if (dto.startDate) data.startDate = new Date(dto.startDate);
      if (dto.endDate) data.endDate = new Date(dto.endDate);

      const promotion = await this.promotionsRepository.update(id, data);
      if (!promotion) {
        throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
      }
      return promotion;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async updatePromotionStatus(id: number, status: PromotionStatus): Promise<PromotionModel> {
    try {
      if (isNaN(id)) {
        throw new HTTPError(400, MESSAGES.INVALID_FORMAT);
      }
      const promotion = await this.promotionsRepository.update(id, { status });
      if (!promotion) {
        throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
      }
      return promotion;
    } catch (err) {
      return this.handleError(err);
    }
  }

  async deletePromotion(id: number): Promise<PromotionModel> {
    try {
      if (isNaN(id)) {
        throw new HTTPError(400, MESSAGES.INVALID_FORMAT);
      }

      const result = await this.promotionsRepository.findAll({
        filters: { id },
      });
      if (!result.items || result.items.length === 0) {
        throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
      }

      const now = new Date();
      if (
        result.items[0].status === PromotionStatus.APPROVED &&
        result.items[0].startDate <= now &&
        result.items[0].endDate >= now
      ) {
        throw new HTTPError(400, MESSAGES.CANNOT_DELETE_ACTIVE_PROMOTION);
      }

      const deletedPromotion = await this.promotionsRepository.delete(id);
      if (!deletedPromotion) {
        throw new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND);
      }
      return deletedPromotion;
    } catch (err) {
      return this.handleError(err);
    }
  }
}