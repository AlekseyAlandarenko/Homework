import { UserModel, Role } from '@prisma/client';
import { IUsersRepository, WarehouseManagerResponse } from './users.repository.interface';
import { User } from './user.entity';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';

@injectable()
export class UsersRepository implements IUsersRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	async create({ email, password, name, role }: User): Promise<UserModel> {
		return this.prismaService.client.userModel.create({
			data: {
				email,
				password,
				name,
				role: role as Role,
			},
		});
	}

	async find(email: string): Promise<UserModel | null> {
		return this.prismaService.client.userModel.findFirst({
			where: { email },
		});
	}

	async findById(id: number): Promise<UserModel | null> {
		return this.prismaService.client.userModel.findFirst({
			where: { id },
		});
	}

	async findAllWarehouseManagers(): Promise<WarehouseManagerResponse[]> {
		return this.prismaService.client.userModel.findMany({
			where: { role: 'WAREHOUSE_MANAGER' },
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	async update(id: number, data: Partial<UserModel>): Promise<UserModel | null> {
		return this.prismaService.client.userModel.update({
			where: { id },
			data,
		});
	}

	async delete(id: number): Promise<UserModel | null> {
		return this.prismaService.client.userModel.delete({
			where: { id },
		});
	}
}
