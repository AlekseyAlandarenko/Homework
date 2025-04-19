import { App } from '../src/app';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { MESSAGES } from '../src/common/messages';

export interface UserCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface PromotionPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  supplierId?: number;
}

export const cleanUp = async (prisma: PrismaClient) => {
  await prisma.promotionModel.deleteMany({});
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

export const createTestSupplier = async (app: App['app'], adminToken: string) => {
  const supplierData: UserCredentials = {
    email: 'supplier@test.com',
    password: 'password123',
    name: 'Test Supplier',
  };

  const res = await request(app)
    .post('/users/supplier')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(supplierData);
  if (res.statusCode !== 201) throw new Error(MESSAGES.FAILED_TO_CREATE_SUPPLIER);

  const { token } = await loginUser(app, supplierData);
  return { supplierId: res.body.data.id, supplierToken: token };
};

export const createTestPromotion = async (
  app: App['app'],
  token: string,
  supplierId: number,
  overrides: Partial<PromotionPayload> = {}
) => {
  const defaultPromotion: PromotionPayload = {
    title: 'Test Promotion',
    description: 'Test Description',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    supplierId,
  };

  const res = await request(app)
    .post('/promotions')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...defaultPromotion, ...overrides });
  return { status: res.statusCode, data: res.body.data, error: res.body.error };
};