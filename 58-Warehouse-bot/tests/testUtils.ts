import { App } from '../src/app';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { MESSAGES } from '../src/common/messages';
import { ProductStatus } from '../src/common/enums/product-status.enum';

export interface UserCredentials {
    email: string;
    password: string;
    name?: string;
    cityId?: number;
}

export interface ProductPayload {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    sku?: string;
    status?: ProductStatus;
    createdById?: number;
}

export const cleanUp = async (prisma: PrismaClient) => {
    await prisma.cartModel.deleteMany({});
    await prisma.productModel.deleteMany({});
    await prisma.addressModel.deleteMany({});
    await prisma.telegramSession.deleteMany({});
    await prisma.userModel.deleteMany({
        where: {
            OR: [
                { email: { contains: '@test.com' } },
                { role: 'WAREHOUSE_MANAGER' },
                { role: 'ADMIN', email: { not: 'superadmin@example.com' } },
            ],
        },
    });
};

export const loginUser = async (app: App['app'], credentials: UserCredentials) => {
    const res = await request(app).post('/users/login').send(credentials);
    return { status: res.statusCode, token: res.body.data?.jwt, error: res.body.error };
};

export const createTestWarehouseManager = async (app: App['app'], adminToken: string) => {
    const managerData: UserCredentials = {
        email: `manager-${Date.now()}@test.com`,
        password: 'Password123',
        name: 'Тестовый Начальник склада',
    };

    const res = await request(app)
        .post('/users/warehouse-manager')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(managerData);
    if (res.statusCode !== 201) throw new Error(res.body.error || MESSAGES.VALIDATION_ERROR);

    const { token } = await loginUser(app, managerData);
    return { managerId: res.body.data.id, managerToken: token, managerEmail: managerData.email };
};

export const createTestProduct = async (
    app: App['app'],
    token: string,
    managerId: number,
    overrides: Partial<ProductPayload> = {},
) => {
    const defaultProduct: ProductPayload = {
        name: 'Тестовый Товар',
        description: 'Тестовое Описание',
        price: 100,
        quantity: 10,
        sku: `SKU-${Date.now()}`,
        status: ProductStatus.AVAILABLE,
    };

    const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...defaultProduct, ...overrides });

    return { status: res.statusCode, data: res.body.data, error: res.body.error };
};