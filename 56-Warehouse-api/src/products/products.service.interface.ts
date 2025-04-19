import { ProductModel } from '@prisma/client';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';

export interface IProductsService {
    createProduct(dto: ProductCreateDto & { userEmail?: string }): Promise<ProductModel>;
    getAllProducts(params?: {
        filters?: {
            category?: string;
            isActive?: boolean;
            quantity?: number;
            name?: string;
            priceMin?: number;
            priceMax?: number;
        };
        sort?: { sortBy: keyof ProductModel; sortOrder: 'asc' | 'desc' };
    }): Promise<ProductModel[]>;
    getProductsByManager(email?: string): Promise<ProductModel[]>;
    getProductStatus(id: number): Promise<{ id: number; name: string; quantity: number; isActive: boolean; message: string }>;
    updateProduct(id: number, dto: ProductUpdateDto): Promise<ProductModel>;
    addProductQuantity(id: number, quantity: number, userEmail?: string): Promise<ProductModel>;
    purchaseProduct(id: number, quantity: number, userEmail?: string): Promise<ProductModel>;
    deleteProduct(id: number): Promise<ProductModel>;
}