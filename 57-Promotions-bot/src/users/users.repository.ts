import { Prisma } from '@prisma/client';
import {
	IUsersRepository,
	SupplierResponse,
	UserWithCategories,
} from './users.repository.interface';
import { User } from './user.entity';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MESSAGES } from '../common/messages';
import { DEFAULT_PAGINATION } from '../common/constants';
import { Role } from '../common/enums/role.enum';

@injectable()
export class UsersRepository implements IUsersRepository {
	readonly userInclude: Prisma.UserModelInclude = {
		city: { select: { id: true, name: true } },
		preferredCategories: { select: { id: true, name: true } },
	};

	private readonly userSelect = {
		id: true,
		email: true,
		name: true,
		role: true,
		telegramId: true,
		cityId: true,
		createdAt: true,
		updatedAt: true,
		isDeleted: true,
		notificationsEnabled: true,
		...this.userInclude,
	};

	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async createUser(user: User): Promise<UserWithCategories> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction(async (prisma) => {
					return prisma.userModel.create({
						data: {
							email: user.email,
							name: user.name,
							role: user.role,
							password: user.password,
							telegramId: user.telegramId,
							cityId: user.cityId,
							notificationsEnabled: user.notificationsEnabled ?? true,
							preferredCategories: {
								connect: user.preferredCategories?.map((id) => ({ id })) || [],
							},
							isDeleted: false,
						},
						include: this.userInclude,
					});
				}),
			MESSAGES.USER_NOT_FOUND,
		);
	}

	async findUserByKey(
		key: Extract<keyof UserWithCategories, 'email' | 'telegramId' | 'id'>,
		value: string | number,
		userId?: number,
		includeDeleted: boolean = false,
	): Promise<UserWithCategories | null> {
		return this.prismaService.client.userModel.findFirst({
			where: {
				[key]: value,
				...(includeDeleted ? {} : { isDeleted: false }),
				...(userId && { id: userId }),
			},
			include: this.userInclude,
		});
	}

	async findUserByKeyOrThrow(
		key: Extract<keyof UserWithCategories, 'email' | 'telegramId' | 'id'>,
		value: string | number,
	): Promise<UserWithCategories> {
		return this.prismaService.findOrThrow(
			() => this.findUserByKey(key, value),
			MESSAGES.USER_NOT_FOUND,
		);
	}

	async findAllUsers({
		role,
		filters = {},
		pagination = DEFAULT_PAGINATION,
		orderBy,
		includeDeleted = false,
	}: {
		role?: Role;
		filters?: Prisma.UserModelWhereInput;
		pagination?: PaginationDto;
		orderBy?: Prisma.UserModelOrderByWithRelationInput;
		includeDeleted?: boolean;
	} = {}): Promise<PaginatedResponse<SupplierResponse>> {
		const { page, limit } = pagination;
		const skip = (page - 1) * limit;

		const combinedFilters: Prisma.UserModelWhereInput = {
			...filters,
			...(includeDeleted ? {} : { isDeleted: false }),
			...(role ? { role } : {}),
		};

		const [items, total] = await this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction([
					this.prismaService.client.userModel.findMany({
						where: combinedFilters,
						select: this.userSelect,
						skip,
						take: limit,
						orderBy,
					}),
					this.prismaService.client.userModel.count({
						where: combinedFilters,
					}),
				]),
			MESSAGES.USER_NOT_FOUND,
		);

		const totalPages = Math.ceil(total / limit);

		return {
			items,
			total,
			meta: {
				total,
				page,
				limit,
				totalPages,
			},
		};
	}

	async updateUser(id: number, data: Prisma.UserModelUpdateInput): Promise<UserWithCategories> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.userModel.update({
					where: { id },
					data,
					include: this.userInclude,
				}),
			MESSAGES.USER_NOT_FOUND,
		);
	}

	async updateUserCity(id: number, cityId: number): Promise<UserWithCategories> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.userModel.update({
					where: { id },
					data: { cityId },
					include: this.userInclude,
				}),
			MESSAGES.USER_NOT_FOUND,
		);
	}

	async updateUserCategories(
		id: number,
		categoryData: { id: number }[],
	): Promise<UserWithCategories> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.$transaction(async (prisma) => {
					return prisma.userModel.update({
						where: { id },
						data: {
							preferredCategories: {
								set: categoryData,
							},
						},
						include: this.userInclude,
					});
				}),
			MESSAGES.USER_NOT_FOUND,
		);
	}

	async deleteUser(id: number): Promise<UserWithCategories> {
		return this.prismaService.executePrismaOperation(
			() =>
				this.prismaService.client.userModel.update({
					where: { id },
					data: { isDeleted: true },
					include: this.userInclude,
				}),
			MESSAGES.USER_NOT_FOUND,
		);
	}
}
