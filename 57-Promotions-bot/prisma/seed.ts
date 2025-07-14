import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { Logger } from 'tslog';
import { MESSAGES } from '../src/common/messages';
import { Role } from '../src/common/enums/role.enum';
import { PromotionStatus } from '../src/common/enums/promotion-status.enum';
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
      const promoData = [
   {
    title: 'Летняя распродажа 2025',
    description: 'Скидки до 50% на всю летнюю коллекцию',
    startDate: new Date('2025-06-29T00:00:00Z'),
    endDate: new Date('2025-07-15T23:59:59Z'),
    city: 'Москва',
    categories: ['Одежда', 'Развлечения'],
  },
  {
    title: 'Неделя вкусной еды',
    description: 'Попробуйте новые блюда со скидкой 30%',
    startDate: new Date('2025-06-28T00:00:00Z'),
    endDate: new Date('2025-07-05T23:59:59Z'),
    city: 'Санкт-Петербург',
    categories: ['Еда', 'Развлечения'],
  },
  {
    title: 'ТехноSALE',
    description: 'Скидки на всю электронику до 25%',
    startDate: new Date('2025-06-26T00:00:00Z'),
    endDate: new Date('2025-07-07T23:59:59Z'),
    city: 'Новосибирск',
    categories: ['Техника'],
  },
  {
    title: 'Праздник развлечений',
    description: '2 билета по цене 1 на все мероприятия',
    startDate: new Date('2025-06-30T00:00:00Z'),
    endDate: new Date('2025-07-06T23:59:59Z'),
    city: 'Москва',
    categories: ['Развлечения', 'Еда'],
  },
  {
    title: 'Сладкие выходные',
    description: 'Десерты с 40% скидкой',
    startDate: new Date('2025-07-01T00:00:00Z'),
    endDate: new Date('2025-07-03T23:59:59Z'),
    city: 'Санкт-Петербург',
    categories: ['Еда'],
  },
  {
    title: 'Одежда для всей семьи',
    description: 'Скидки на семейные коллекции',
    startDate: new Date('2025-06-27T00:00:00Z'),
    endDate: new Date('2025-07-07T23:59:59Z'),
    city: 'Новосибирск',
    categories: ['Одежда'],
  },
  {
    title: 'Гаджет-Бум',
    description: 'Эксклюзивные предложения на смартфоны',
    startDate: new Date('2025-06-25T00:00:00Z'),
    endDate: new Date('2025-07-10T23:59:59Z'),
    city: 'Москва',
    categories: ['Техника', 'Развлечения'],
  },
  {
    title: 'Детская радость',
    description: 'Скидки на развлечения для детей',
    startDate: new Date('2025-07-01T00:00:00Z'),
    endDate: new Date('2025-07-08T23:59:59Z'),
    city: 'Санкт-Петербург',
    categories: ['Развлечения'],
  },
  {
    title: 'ГастроФест',
    description: 'Лучшие рестораны по спец. ценам',
    startDate: new Date('2025-07-02T00:00:00Z'),
    endDate: new Date('2025-07-10T23:59:59Z'),
    city: 'Новосибирск',
    categories: ['Еда'],
  },
  {
    title: 'Большой техно-марафон',
    description: 'Скидки на бытовую технику и электронику',
    startDate: new Date('2025-06-29T00:00:00Z'),
    endDate: new Date('2025-07-15T23:59:59Z'),
    city: 'Москва',
    categories: ['Техника'],
  },
      ];

      for (const promo of promoData) {
        const city = cityRecords.find(c => c.name === promo.city);
        if (!city) {
          logger.error(MESSAGES.SEED_PROMO_CITY_NOT_FOUND);
          throw new Error(MESSAGES.SEED_PROMO_CITY_NOT_FOUND);
        }

        if (promo.startDate >= promo.endDate) {
          throw new Error(MESSAGES.END_DATE_INVALID_DATES);
        }

        await prisma.promotionModel.upsert({
          where: { title: promo.title },
          update: {},
          create: {
            title: promo.title,
            description: promo.description,
            startDate: promo.startDate,
            endDate: promo.endDate,
            status: PromotionStatus.APPROVED,
            supplierId: adminUserId,
            cityId: city.id,
            categories: {
              connect: promo.categories.map(name => {
                const cat = categoryRecords.find(c => c.name === name);
                if (!cat) {
                  logger.error(MESSAGES.SEED_INVALID_PROMO_CATEGORY);
                  throw new Error(MESSAGES.SEED_INVALID_PROMO_CATEGORY);
                }
                return { id: cat.id };
              }),
            },
          },
        });
      }
      logger.info(MESSAGES.SEED_PROMOTIONS_CREATED);
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