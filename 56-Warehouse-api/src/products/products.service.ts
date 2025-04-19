import { inject, injectable } from 'inversify';
import { ProductModel, Prisma, UserModel } from '@prisma/client';
import { Product } from './product.entity';
import { IProductsService } from './products.service.interface';
import { TYPES } from '../types';
import { IProductsRepository } from './products.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { ProductCreateDto } from './dto/product-create.dto';
import { ProductUpdateDto } from './dto/product-update.dto';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

@injectable()
export class ProductsService implements IProductsService {
    constructor(
        @inject(TYPES.ProductsRepository) private productsRepository: IProductsRepository,
        @inject(TYPES.UsersService) private usersService: IUsersService,
    ) {}

    private handleError(err: unknown): never {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2025') {
                throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
            }
            if (
                err.code === 'P2002' &&
                Array.isArray(err.meta?.target) &&
                err.meta.target.includes('sku')
            ) {
                throw new HTTPError(422, MESSAGES.SKU_ALREADY_EXISTS);
            }
        }
        throw err instanceof HTTPError ? err : new HTTPError(500, MESSAGES.SERVER_ERROR);
    }

    private validateProductData(dto: ProductCreateDto | ProductUpdateDto): void {
        if (dto.price !== undefined && dto.price < 0) {
            throw new HTTPError(422, MESSAGES.PRICE_NEGATIVE);
        }
        if (dto.quantity !== undefined && dto.quantity < 0) {
            throw new HTTPError(422, MESSAGES.QUANTITY_NEGATIVE);
        }
    }

    private validateId(id: number): void {
        if (isNaN(id)) {
            throw new HTTPError(400, MESSAGES.INVALID_FORMAT);
        }
    }

    private async validateUser(
        email: string | undefined,
        allowedRoles?: string[],
    ): Promise<UserModel> {
        if (!email) {
            throw new HTTPError(401, MESSAGES.UNAUTHORIZED);
        }
        const user = await this.usersService.getUserInfo(email);
        if (!user) {
            throw new HTTPError(404, MESSAGES.USER_NOT_FOUND);
        }
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            throw new HTTPError(403, MESSAGES.FORBIDDEN);
        }
        return user;
    }

    async createProduct(dto: ProductCreateDto & { userEmail?: string }): Promise<ProductModel> {
        try {
            const user = await this.validateUser(dto.userEmail);
            this.validateProductData(dto);

            const sku = dto.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const product = new Product(
                dto.name,
                dto.description ?? null,
                dto.price,
                dto.quantity,
                dto.category ?? null,
                sku,
                dto.isActive ?? true,
                user.id,
                user.id,
            );
            return await this.productsRepository.create(product);
        } catch (err) {
            return this.handleError(err);
        }
    }

    async getAllProducts({
        filters = {},
        sort = { sortBy: 'id', sortOrder: 'asc' },
    }: {
        filters?: {
            category?: string;
            isActive?: boolean;
            quantity?: number;
            name?: string;
            priceMin?: number;
            priceMax?: number;
        };
        sort?: { sortBy: string; sortOrder: 'asc' | 'desc' };
    } = {}): Promise<ProductModel[]> {
        try {
            const validSortFields: string[] = [
                'id',
                'name',
                'price',
                'quantity',
                'createdAt',
                'updatedAt',
                'category',
                'sku',
                'isActive',
            ];
            if (!validSortFields.includes(sort.sortBy)) {
                throw new HTTPError(422, MESSAGES.INVALID_SORT_PARAM);
            }
            if (filters.priceMin !== undefined && filters.priceMin < 0) {
                throw new HTTPError(422, MESSAGES.INVALID_FILTER);
            }
            if (filters.priceMax !== undefined && filters.priceMax < 0) {
                throw new HTTPError(422, MESSAGES.INVALID_FILTER);
            }
            if (filters.quantity !== undefined && filters.quantity < 0) {
                throw new HTTPError(422, MESSAGES.INVALID_FILTER);
            }

            const prismaFilters: any = {};
            if (filters.category) prismaFilters.category = filters.category;
            if (filters.isActive !== undefined) prismaFilters.isActive = filters.isActive;
            if (filters.quantity !== undefined) prismaFilters.quantity = { gte: filters.quantity };
            if (filters.name) prismaFilters.name = { contains: filters.name, mode: 'insensitive' };
            if (filters.priceMin !== undefined)
                prismaFilters.price = { ...prismaFilters.price, gte: filters.priceMin };
            if (filters.priceMax !== undefined)
                prismaFilters.price = { ...prismaFilters.price, lte: filters.priceMax };

            return await this.productsRepository.findAll({
                filters: prismaFilters,
                orderBy: { [sort.sortBy]: sort.sortOrder },
            });
        } catch (err) {
            return this.handleError(err);
        }
    }

    async getProductsByManager(email?: string): Promise<ProductModel[]> {
        try {
            const user = await this.validateUser(email, ['WAREHOUSE_MANAGER']);
            const products = await this.productsRepository.findByManager(user.id);
            return products;
        } catch (err) {
            return this.handleError(err);
        }
    }

    async getProductStatus(
        id: number,
    ): Promise<{ id: number; name: string; quantity: number; isActive: boolean; message: string }> {
        try {
            this.validateId(id);
            const product = await this.productsRepository.findById(id);
            if (!product) {
                throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
            }
            return {
                id: product.id,
                name: product.name,
                quantity: product.quantity,
                isActive: product.isActive,
                message: product.quantity === 0 ? MESSAGES.PRODUCT_OUT_OF_STOCK : '',
            };
        } catch (err) {
            return this.handleError(err);
        }
    }

    async updateProduct(id: number, dto: ProductUpdateDto): Promise<ProductModel> {
        try {
            this.validateId(id);
            if (Object.keys(dto).length === 0) {
                throw new HTTPError(422, MESSAGES.VALIDATION_FAILED);
            }
            this.validateProductData(dto);

            const data: Partial<ProductModel> = {};
            if (dto.name) data.name = dto.name;
            if (dto.description) data.description = dto.description;
            if (dto.price) data.price = dto.price;
            if (dto.quantity !== undefined) data.quantity = dto.quantity;
            if (dto.category) data.category = dto.category;
            if (dto.sku) data.sku = dto.sku;
            if (dto.isActive !== undefined) data.isActive = dto.isActive;

            const product = await this.productsRepository.update(id, data);
            if (!product) {
                throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
            }
            return product;
        } catch (err) {
            return this.handleError(err);
        }
    }

    async addProductQuantity(
        id: number,
        quantity: number,
        userEmail?: string,
    ): Promise<ProductModel> {
        try {
            this.validateId(id);
            if (quantity <= 0) {
                throw new HTTPError(422, MESSAGES.QUANTITY_ZERO_OR_NEGATIVE);
            }
            const user = await this.validateUser(userEmail, ['WAREHOUSE_MANAGER']);
            const product = await this.productsRepository.findById(id);
            if (!product) {
                throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
            }
            const newQuantity = product.quantity + quantity;
            const updatedProduct = await this.productsRepository.update(id, {
                quantity: newQuantity,
                isActive: newQuantity > 0,
                updatedById: user.id,
            });
            if (!updatedProduct) {
                throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
            }
            return updatedProduct;
        } catch (err) {
            return this.handleError(err);
        }
    }

    async purchaseProduct(id: number, quantity: number, userEmail?: string): Promise<ProductModel> {
        try {
            this.validateId(id);
            const user = await this.validateUser(userEmail, ['ADMIN', 'SUPERADMIN']);
            if (quantity <= 0) {
                throw new HTTPError(422, MESSAGES.QUANTITY_ZERO_OR_NEGATIVE);
            }
            const product = await this.productsRepository.findById(id);
            if (!product) {
                throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
            }
            if (product.quantity === 0) {
                throw new HTTPError(422, MESSAGES.PRODUCT_OUT_OF_STOCK);
            }
            if (product.quantity < quantity) {
                throw new HTTPError(422, MESSAGES.PRODUCT_INSUFFICIENT_STOCK);
            }
            const newQuantity = product.quantity - quantity;
            const updatedProduct = await this.productsRepository.update(id, {
                quantity: newQuantity,
                isActive: newQuantity > 0,
                updatedById: user.id,
            });
            if (!updatedProduct) {
                throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
            }
            return updatedProduct;
        } catch (err) {
            return this.handleError(err);
        }
    }

    async deleteProduct(id: number): Promise<ProductModel> {
        try {
            this.validateId(id);
            const result = await this.productsRepository.delete(id);
            if (!result) {
                throw new HTTPError(404, MESSAGES.PRODUCT_NOT_FOUND);
            }
            return result;
        } catch (err) {
            return this.handleError(err);
        }
    }
}