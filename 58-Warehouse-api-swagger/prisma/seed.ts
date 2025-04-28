import { PrismaClient, Role } from '@prisma/client';
import { User } from '../src/users/user.entity';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL || 'superadmin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'superadmin_password';
  const name = process.env.SEED_ADMIN_NAME || 'SuperAdmin';
  const salt = Number(process.env.SALT) || 10;

  try {
    const existingUser = await prisma.userModel.findFirst({ where: { email } });
    if (existingUser) {
      console.log(`Пользователь ${email} уже существует`);
      return;
    }

    const user = new User(email, name, 'SUPERADMIN');
    await user.setPassword(password, salt);
    await prisma.userModel.create({
      data: {
        email: user.email,
        name: user.name,
        password: user.password,
        role: user.role as Role,
      },
    });
    console.log('Сид данные загружены');
  } catch (e) {
    console.error('Ошибка при загрузке сид данных:', e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();