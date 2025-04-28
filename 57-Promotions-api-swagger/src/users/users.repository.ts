import { UserModel, Role } from '@prisma/client';
import { IUsersRepository, SupplierResponse } from './users.repository.interface';
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

  async findAllSuppliers({
    page = 1,
    limit = 10,
  }: { page?: number; limit?: number } = {}): Promise<{
    items: SupplierResponse[];
    total: number;
  }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prismaService.client.userModel.findMany({
        where: { role: 'SUPPLIER' },
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
      this.prismaService.client.userModel.count({
        where: { role: 'SUPPLIER' },
      }),
    ]);
    return { items, total };
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
