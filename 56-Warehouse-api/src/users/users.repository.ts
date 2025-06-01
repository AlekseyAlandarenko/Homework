import { UserModel } from '@prisma/client';
import { IUsersRepository, WarehouseManagerResponse } from './users.repository.interface';
import { User } from './user.entity';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';
import { PaginatedResponse, DEFAULT_PAGINATION } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

@injectable()
export class UsersRepository implements IUsersRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async createUser({ email, password, name, role }: User): Promise<UserModel> {
		return this.prismaService.client.userModel.create({
			data: { email, password, name, role },
		});
	}

	async findByEmail(email: string): Promise<UserModel | null> {
		return this.prismaService.client.userModel.findFirst({ where: { email } });
	}

	async findByEmailOrThrow(email: string): Promise<UserModel> {
		const user = await this.findByEmail(email);
		if (!user) {
			throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
		}
		return user;
	}

	async findById(id: number): Promise<UserModel | null> {
		return this.prismaService.client.userModel.findFirst({ where: { id } });
	}

	async findByIdOrThrow(id: number): Promise<UserModel> {
		const user = await this.findById(id);
		if (!user) {
			throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
		}
		return user;
	}

	async findAllWarehouseManagers(
		pagination: PaginationDto = DEFAULT_PAGINATION,
	): Promise<PaginatedResponse<WarehouseManagerResponse>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.prismaService.client.userModel.findMany({
				where: { role: 'WAREHOUSE_MANAGER' },
				select: {
					id: true,
					email: true,
					name: true,
					role: true,
					createdAt: true,
					updatedAt: true,
				},
				skip,
				take: limit,
			}),
			this.prismaService.client.userModel.count({ where: { role: 'WAREHOUSE_MANAGER' } }),
		]);
		return { items, total };
	}

	async updateUser(id: number, data: Partial<UserModel>): Promise<UserModel> {
		const user = await this.findByIdOrThrow(id);
		return this.prismaService.client.userModel.update({ where: { id }, data });
	}

	async deleteUser(id: number): Promise<UserModel> {
		const user = await this.findByIdOrThrow(id);
		return this.prismaService.client.userModel.delete({ where: { id } });
	}
}
