import { App } from '../src/app';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { MESSAGES } from '../src/common/messages';

export interface UserCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  sku?: string;
  isActive?: boolean;
}

export const cleanUp = async (prisma: PrismaClient) => {
  await prisma.productModel.deleteMany({});
  await prisma.userModel.deleteMany({
    where: { email: { contains: '@test.com' } },
  });
};

export const loginUser = async (app: App['app'], credentials: UserCredentials) => {
  const res = await request(app)
    .post('/users/login')
    .send(credentials);
  return { status: res.statusCode, token: res.body.data?.jwt, error: res.body.error };
};

export const createTestWarehouseManager = async (app: App['app'], adminToken: string) => {
  const managerData: UserCredentials = {
    email: 'manager@test.com',
    password: 'password123',
    name: 'Test Manager',
  };

  const res = await request(app)
    .post('/users/warehouseManager')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(managerData);
  if (res.statusCode !== 201) throw new Error(MESSAGES.FAILED_TO_CREATE_WAREHOUSE_MANAGER);

  const { token } = await loginUser(app, managerData);
  return { managerId: res.body.data.id, managerToken: token };
};

export const createTestProduct = async (
  app: App['app'],
  token: string,
  createdById: number,
  overrides: Partial<ProductPayload> = {}
) => {
  const defaultProduct: ProductPayload = {
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    quantity: 10,
    category: 'Test Category',
    sku: `SKU-${Date.now()}`,
    isActive: true,
  };

  const res = await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...defaultProduct, ...overrides });
  return { status: res.statusCode, data: res.body.data, error: res.body.error };
};