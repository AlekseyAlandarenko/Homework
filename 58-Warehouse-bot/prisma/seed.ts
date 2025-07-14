import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Logger } from 'tslog';
import { MESSAGES } from '../src/common/messages';
import { Role } from '../src/common/enums/role.enum';
import { hash } from 'bcryptjs';

config();
const logger = new Logger({ name: 'SeedScript' });
const prisma = new PrismaClient();

interface EnvConfig {
  SEED_ADMIN_EMAIL: string;
  SEED_ADMIN_PASSWORD: string;
  SEED_ADMIN_NAME: string;
  SEED_ADMIN_CITY: string;
  SALT: number;
}

function validateEnv(): EnvConfig {
  const requiredVars = ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD', 'SEED_ADMIN_NAME', 'SEED_ADMIN_CITY', 'SALT'];
  const missingVars = requiredVars.filter(key => !process.env[key]);
  if (missingVars.length > 0) {
    logger.error(MESSAGES.SEED_MISSING_REQUIRED_ENV_VARS);
    throw new Error(MESSAGES.SEED_MISSING_REQUIRED_ENV_VARS);
  }

  const salt = Number(process.env.SALT);
  if (isNaN(salt) || salt < 8) {
    throw new Error(MESSAGES.SEED_INVALID_SALT_VALUE);
  }

  const password = process.env.SEED_ADMIN_PASSWORD!;
  if (password.length < 8 || !/^(?=.*[A-Za-zА-Яа-я])(?=.*\d)/.test(password)) {
    throw new Error(MESSAGES.SEED_INVALID_ADMIN_PASSWORD);
  }

  const email = process.env.SEED_ADMIN_EMAIL!;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(MESSAGES.SEED_INVALID_ADMIN_EMAIL);
  }

  const name = process.env.SEED_ADMIN_NAME!;
  if (name.length > 100 || !/^[A-Za-zА-Яа-яёЁ\s-]+$/.test(name)) {
    throw new Error(MESSAGES.SEED_INVALID_ADMIN_NAME);
  }

  return {
    SEED_ADMIN_EMAIL: email,
    SEED_ADMIN_PASSWORD: password,
    SEED_ADMIN_NAME: name,
    SEED_ADMIN_CITY: process.env.SEED_ADMIN_CITY!,
    SALT: salt,
  };
}

async function seed() {
  try {
    const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME, SEED_ADMIN_CITY, SALT } = validateEnv();
    logger.info(MESSAGES.SEED_START);

    const cities = [
      { name: 'Москва' },
      { name: 'Санкт-Петербург' },
      { name: 'Новосибирск' },
    ];
    for (const city of cities) {
      await prisma.cityModel.upsert({
        where: { name: city.name },
        update: {},
        create: { name: city.name },
      });
    }
    logger.info(MESSAGES.SEED_CITIES_CREATED);

    const adminCity = await prisma.cityModel.findUnique({
      where: { name: SEED_ADMIN_CITY },
      select: { id: true },
    });
    if (!adminCity) {
      logger.error(MESSAGES.SEED_ADMIN_CITY_NOT_FOUND);
      throw new Error(MESSAGES.SEED_ADMIN_CITY_NOT_FOUND);
    }

    const categories = [
      { name: 'Еда' },
      { name: 'Одежда' },
      { name: 'Техника' },
      { name: 'Развлечения' },
    ];
    for (const category of categories) {
      await prisma.categoryModel.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
    }
    logger.info(MESSAGES.SEED_CATEGORIES_CREATED);

    const existingUser = await prisma.userModel.findFirst({ where: { email: SEED_ADMIN_EMAIL } });
    let adminUserId: number | null = null;
    if (existingUser) {
      logger.info(MESSAGES.SEED_USER_EXISTS);
      adminUserId = existingUser.id;
    } else {
      const hashedPassword = await hash(SEED_ADMIN_PASSWORD, SALT);
      const createdUser = await prisma.userModel.create({
        data: {
          email: SEED_ADMIN_EMAIL,
          name: SEED_ADMIN_NAME,
          password: hashedPassword,
          role: Role.SUPERADMIN || 'SUPERADMIN',
          telegramId: null,
          cityId: adminCity.id,
          preferredCategories: {
            connect: categories.map(c => ({ name: c.name })),
          },
        },
      });
      adminUserId = createdUser.id;
      logger.info(MESSAGES.USER_CREATED);
    }

    if (adminUserId) {
      const cityRecords = await prisma.cityModel.findMany();
      const categoryRecords = await prisma.categoryModel.findMany();
      const productData = [
        {
          name: 'Футболка летняя',
          description: 'Удобная хлопковая футболка',
          price: 799.99,
          quantity: 100,
          sku: 'TSHIRT001',
          status: 'AVAILABLE',
          city: 'Москва',
          categories: ['Одежда', 'Развлечения'],
        },
        {
          name: 'Кофе в зернах',
          description: 'Арабика премиум-класса',
          price: 1299.99,
          quantity: 50,
          sku: 'COFFEE001',
          status: 'AVAILABLE',
          city: 'Санкт-Петербург',
          categories: ['Еда'],
        },
        {
          name: 'Смартфон X',
          description: 'Современный смартфон с 5G',
          price: 49999.99,
          quantity: 0,
          sku: 'PHONE001',
          status: 'OUT_OF_STOCK',
          city: 'Новосибирск',
          categories: ['Техника'],
        },
        {
          name: 'Наушники беспроводные',
          description: 'Bluetooth-наушники с шумоподавлением',
          price: 5999.99,
          quantity: 30,
          sku: 'HEADPH001',
          status: 'AVAILABLE',
          city: 'Москва',
          categories: ['Техника', 'Развлечения'],
        },
        {
          name: 'Шоколадный торт',
          description: 'Свежий торт с натуральным шоколадом',
          price: 1499.99,
          quantity: 20,
          sku: 'CAKE001',
          status: 'AVAILABLE',
          city: 'Санкт-Петербург',
          categories: ['Еда'],
        },
        {
          name: 'Джинсы классические',
          description: 'Удобные джинсы прямого кроя',
          price: 3999.99,
          quantity: 60,
          sku: 'JEANS001',
          status: 'AVAILABLE',
          city: 'Новосибирск',
          categories: ['Одежда'],
        },
        {
          name: 'Ноутбук Pro',
          description: 'Мощный ноутбук для работы и игр',
          price: 89999.99,
          quantity: 10,
          sku: 'LAPTOP001',
          status: 'AVAILABLE',
          city: 'Москва',
          categories: ['Техника'],
        },
        {
          name: 'Кроссовки спортивные',
          description: 'Легкие кроссовки для бега',
          price: 4999.99,
          quantity: 40,
          sku: 'SNEAK001',
          status: 'AVAILABLE',
          city: 'Санкт-Петербург',
          categories: ['Одежда', 'Развлечения'],
        },
        {
          name: 'Чай зеленый',
          description: 'Натуральный зеленый чай',
          price: 499.99,
          quantity: 80,
          sku: 'TEA001',
          status: 'AVAILABLE',
          city: 'Новосибирск',
          categories: ['Еда'],
        },
        {
          name: 'Планшет 10"',
          description: 'Планшет с ярким экраном',
          price: 24999.99,
          quantity: 15,
          sku: 'TABLET001',
          status: 'AVAILABLE',
          city: 'Москва',
          categories: ['Техника'],
        },
      ];

      for (const product of productData) {
        const city = cityRecords.find(c => c.name === product.city);
        if (!city) {
          logger.error(MESSAGES.SEED_PRODUCT_CITY_NOT_FOUND);
          throw new Error(MESSAGES.SEED_PRODUCT_CITY_NOT_FOUND);
        }

        await prisma.productModel.upsert({
          where: { sku: product.sku },
          update: {},
          create: {
            name: product.name,
            description: product.description,
            price: product.price,
            quantity: product.quantity,
            sku: product.sku,
            status: product.status,
            cityId: city.id,
            createdById: adminUserId,
            categories: {
              connect: product.categories.map(name => {
                const cat = categoryRecords.find(c => c.name === name);
                if (!cat) {
                  logger.error(MESSAGES.SEED_INVALID_PRODUCT_CATEGORY);
                  throw new Error(MESSAGES.SEED_INVALID_PRODUCT_CATEGORY);
                }
                return { id: cat.id };
              }),
            },
          },
        });
      }
      logger.info(MESSAGES.SEED_PRODUCTS_CREATED);
    }

    logger.info(MESSAGES.SEED_SUCCESS);
  } catch (e) {
    logger.error(MESSAGES.SEED_FAILED);
    throw e;
  } finally {
    await prisma.$disconnect();
    logger.info(MESSAGES.SEED_DB_DISCONNECTED);
  }
}

seed().catch(e => {
  logger.error(MESSAGES.SEED_CRITICAL_ERROR);
  process.exit(1);
});