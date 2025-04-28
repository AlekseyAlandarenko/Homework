import { ProductModel, Prisma } from '@prisma/client';
import { Product } from './product.entity';

export interface IProductsRepository {
    create(product: Product): Promise<ProductModel>;
    findAll(params?: {
        filters?: Prisma.ProductModelWhereInput;
        orderBy?: { [key: string]: 'asc' | 'desc' };
        page?: number;
        limit?: number;
    }): Promise<{
        items: ProductModel[];
        total: number;
    }>;
    findByManager(managerId: number): Promise<ProductModel[]>;
    findById(id: number): Promise<ProductModel | null>;
    update(id: number, data: Partial<ProductModel>): Promise<ProductModel | null>;
    delete(id: number): Promise<ProductModel | null>;
}