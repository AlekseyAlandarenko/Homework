import { Prisma, ProductModel } from '@prisma/client';
import { IProductsRepository } from './products.repository.interface';
import { Product } from './product.entity';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';

@injectable()
export class ProductsRepository implements IProductsRepository {
    constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

    async create({
        name,
        description,
        price,
        quantity,
        category,
        sku,
        isActive,
        createdById,
        updatedById,
    }: Product): Promise<ProductModel> {
        return this.prismaService.client.productModel.create({
            data: {
                name,
                description,
                price,
                quantity,
                category,
                sku,
                isActive,
                createdById,
                updatedById,
            },
        });
    }

    async findAll({
        filters = {},
        orderBy = { id: 'asc' },
    }: {
        filters?: Prisma.ProductModelWhereInput;
        orderBy?: { [key: string]: 'asc' | 'desc' };
    } = {}): Promise<ProductModel[]> {
        return this.prismaService.client.productModel.findMany({
            where: filters,
            orderBy,
        });
    }

    async findByManager(managerId: number): Promise<ProductModel[]> {
        return this.prismaService.client.productModel.findMany({
            where: {
                createdById: managerId,
            },
        });
    }

    async findById(id: number): Promise<ProductModel | null> {
        return this.prismaService.client.productModel.findUnique({
            where: { id },
        });
    }

    async update(id: number, data: Partial<ProductModel>): Promise<ProductModel | null> {
        return this.prismaService.client.productModel.update({
            where: { id },
            data,
        });
    }

    async delete(id: number): Promise<ProductModel | null> {
        return this.prismaService.client.productModel.delete({
            where: { id },
        });
    }
}