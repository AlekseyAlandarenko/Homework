import { Container } from 'inversify';
import { IPromotionsRepository } from './promotions.repository.interface';
import { IUsersService } from '../users/users.service.interface';
import { IPromotionsService } from './promotions.service.interface';
import { TYPES } from '../types';
import { PromotionsService } from './promotions.service';
import { PromotionStatus, Prisma, Role } from '@prisma/client';
import 'reflect-metadata';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

const PromotionsRepositoryMock: IPromotionsRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findBySupplier: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const UsersServiceMock: IUsersService = {
  createAdmin: jest.fn(),
  createSupplier: jest.fn(),
  validateUser: jest.fn(),
  login: jest.fn(),
  getUserInfo: jest.fn(),
  getUserInfoById: jest.fn(),
  updateSupplierPassword: jest.fn(),
  deleteSupplier: jest.fn(),
  getAllSuppliers: jest.fn(),
};

const container = new Container();
let promotionsRepository: IPromotionsRepository;
let usersService: IUsersService;
let promotionsService: IPromotionsService;

beforeAll(() => {
  container.bind<IPromotionsService>(TYPES.PromotionsService).to(PromotionsService);
  container
    .bind<IPromotionsRepository>(TYPES.PromotionsRepository)
    .toConstantValue(PromotionsRepositoryMock);
  container.bind<IUsersService>(TYPES.UsersService).toConstantValue(UsersServiceMock);

  promotionsRepository = container.get<IPromotionsRepository>(TYPES.PromotionsRepository);
  usersService = container.get<IUsersService>(TYPES.UsersService);
  promotionsService = container.get<IPromotionsService>(TYPES.PromotionsService);
});

describe('Сервис акций', () => {
  const mockPromotion = {
    id: 1,
    title: 'Test Promotion',
    description: 'Test Description',
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-05-10'),
    status: 'PENDING' as PromotionStatus,
    supplierId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockActivePromotion = {
    id: 2,
    title: 'Active Promotion',
    description: 'Active Description',
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    status: 'APPROVED' as PromotionStatus,
    supplierId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'SUPPLIER' as Role,
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin = {
    id: 2,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN' as Role,
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Создание акции', () => {
    it('Должен успешно создать акцию', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
      usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);
      promotionsRepository.create = jest.fn().mockResolvedValue(mockPromotion);

      const result = await promotionsService.createPromotion({
        title: 'Test Promotion',
        description: 'Test Description',
        startDate: '2025-05-01',
        endDate: '2025-05-10',
        userEmail: 'test@example.com',
        supplierId: 1,
        status: 'PENDING',
      });

      expect(result).toEqual(mockPromotion);
      expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
      expect(promotionsRepository.create).toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError, если userEmail отсутствует', async () => {
      await expect(
        promotionsService.createPromotion({
          title: 'Test Promotion',
          description: 'Test Description',
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          supplierId: 1,
          status: 'PENDING',
        }),
      ).rejects.toThrowError(new HTTPError(401, MESSAGES.UNAUTHORIZED));
      expect(usersService.getUserInfoById).not.toHaveBeenCalled();
      expect(promotionsRepository.create).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError, если пользователь не найден', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(null);

      await expect(
        promotionsService.createPromotion({
          title: 'Test Promotion',
          description: 'Test Description',
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          userEmail: 'nonexistent@example.com',
          supplierId: 1,
          status: 'PENDING',
        }),
      ).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
      expect(usersService.getUserInfoById).not.toHaveBeenCalled();
      expect(promotionsRepository.create).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError, если поставщик не найден', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
      usersService.getUserInfoById = jest.fn().mockResolvedValue(null);

      await expect(
        promotionsService.createPromotion({
          title: 'Test Promotion',
          description: 'Test Description',
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          userEmail: 'test@example.com',
          supplierId: 999,
          status: 'PENDING',
        }),
      ).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
      expect(usersService.getUserInfoById).toHaveBeenCalledWith(999);
      expect(promotionsRepository.create).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError, если пользователь не является поставщиком', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
      usersService.getUserInfoById = jest.fn().mockResolvedValue(mockAdmin);

      await expect(
        promotionsService.createPromotion({
          title: 'Test Promotion',
          description: 'Test Description',
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          userEmail: 'test@example.com',
          supplierId: 2,
          status: 'PENDING',
        }),
      ).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
      expect(usersService.getUserInfoById).toHaveBeenCalledWith(2);
      expect(promotionsRepository.create).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError для прошедшей даты начала', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
      usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);

      await expect(
        promotionsService.createPromotion({
          title: 'Test Promotion',
          description: 'Test Description',
          startDate: '2023-01-01',
          endDate: '2023-01-10',
          userEmail: 'test@example.com',
          supplierId: 1,
          status: 'PENDING',
        }),
      ).rejects.toThrowError(new HTTPError(422, MESSAGES.PAST_START_DATE));
      expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
      expect(promotionsRepository.create).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError для некорректного диапазона дат', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
      usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);

      await expect(
        promotionsService.createPromotion({
          title: 'Test Promotion',
          description: 'Test Description',
          startDate: '2025-05-10',
          endDate: '2025-05-01',
          userEmail: 'test@example.com',
          supplierId: 1,
          status: 'PENDING',
        }),
      ).rejects.toThrowError(new HTTPError(422, MESSAGES.INVALID_DATES));
      expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
      expect(promotionsRepository.create).not.toHaveBeenCalled();
    });

    it('Должен обрабатывать ошибки базы данных', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
      usersService.getUserInfoById = jest.fn().mockResolvedValue(mockUser);
      promotionsRepository.create = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(
        promotionsService.createPromotion({
          title: 'Test Promotion',
          description: 'Test Description',
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          userEmail: 'test@example.com',
          supplierId: 1,
          status: 'PENDING',
        }),
      ).rejects.toThrowError(new HTTPError(500, MESSAGES.SERVER_ERROR));
      expect(usersService.getUserInfoById).toHaveBeenCalledWith(1);
      expect(promotionsRepository.create).toHaveBeenCalled();
    });
  });

  describe('Обновление акции', () => {
    it('Должен успешно обновить акцию', async () => {
      promotionsRepository.update = jest.fn().mockResolvedValue({
        ...mockPromotion,
        title: 'Updated Promotion',
      });

      const result = await promotionsService.updatePromotion(1, {
        title: 'Updated Promotion',
      });

      expect(result).toEqual({
        ...mockPromotion,
        title: 'Updated Promotion',
      });
      expect(promotionsRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('Должен выбросить HTTPError для некорректного ID', async () => {
      await expect(
        promotionsService.updatePromotion(NaN, {
          title: 'Updated Promotion',
        }),
      ).rejects.toThrowError(new HTTPError(400, MESSAGES.INVALID_FORMAT));
      expect(promotionsRepository.update).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError для пустых данных обновления', async () => {
      await expect(promotionsService.updatePromotion(1, {})).rejects.toThrowError(
        new HTTPError(422, MESSAGES.VALIDATION_FAILED),
      );
      expect(promotionsRepository.update).not.toHaveBeenCalled();
    });

    it('Должен проверять диапазон дат', async () => {
      await expect(
        promotionsService.updatePromotion(1, {
          startDate: '2025-05-10',
          endDate: '2025-05-01',
        }),
      ).rejects.toThrowError(new HTTPError(422, MESSAGES.INVALID_DATES));
      expect(promotionsRepository.update).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError для прошедшей даты начала', async () => {
      await expect(
        promotionsService.updatePromotion(1, {
          startDate: '2023-01-01',
          endDate: '2023-01-10',
        }),
      ).rejects.toThrowError(new HTTPError(422, MESSAGES.PAST_START_DATE));
      expect(promotionsRepository.update).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError, если акция не найдена', async () => {
      promotionsRepository.update = jest.fn().mockResolvedValue(null);

      await expect(
        promotionsService.updatePromotion(999, {
          title: 'Updated Promotion',
        }),
      ).rejects.toThrowError(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));
      expect(promotionsRepository.update).toHaveBeenCalledWith(999, expect.any(Object));
    });

    it('Должен обрабатывать ошибки Prisma', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
        code: 'P2025',
        clientVersion: '1.0',
      });
      promotionsRepository.update = jest.fn().mockRejectedValue(prismaError);

      await expect(
        promotionsService.updatePromotion(1, {
          title: 'Updated Promotion',
        }),
      ).rejects.toThrowError(new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND));
      expect(promotionsRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe('Обновление статуса акции', () => {
    it('Должен успешно обновить статус', async () => {
      promotionsRepository.update = jest.fn().mockResolvedValue({
        ...mockPromotion,
        status: 'APPROVED',
      });

      const result = await promotionsService.updatePromotionStatus(1, 'APPROVED');

      expect(result).toEqual({
        ...mockPromotion,
        status: 'APPROVED',
      });
      expect(promotionsRepository.update).toHaveBeenCalledWith(1, { status: 'APPROVED' });
    });

    it('Должен выбросить HTTPError для некорректного ID', async () => {
      await expect(promotionsService.updatePromotionStatus(NaN, 'APPROVED')).rejects.toThrowError(
        new HTTPError(400, MESSAGES.INVALID_FORMAT),
      );
      expect(promotionsRepository.update).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError, если акция не найдена', async () => {
      promotionsRepository.update = jest.fn().mockResolvedValue(null);

      await expect(promotionsService.updatePromotionStatus(999, 'APPROVED')).rejects.toThrowError(
        new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
      );
      expect(promotionsRepository.update).toHaveBeenCalledWith(999, { status: 'APPROVED' });
    });

    it('Должен обрабатывать ошибки Prisma', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
        code: 'P2025',
        clientVersion: '1.0',
      });
      promotionsRepository.update = jest.fn().mockRejectedValue(prismaError);

      await expect(promotionsService.updatePromotionStatus(1, 'APPROVED')).rejects.toThrowError(
        new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
      );
      expect(promotionsRepository.update).toHaveBeenCalledWith(1, { status: 'APPROVED' });
    });
  });

  describe('Удаление акции', () => {
    it('Должен успешно удалить неактивную акцию', async () => {
      promotionsRepository.findAll = jest.fn().mockResolvedValue({
        items: [mockPromotion],
        total: 1,
      });
      promotionsRepository.delete = jest.fn().mockResolvedValue(mockPromotion);

      const result = await promotionsService.deletePromotion(1);

      expect(result).toEqual(mockPromotion);
      expect(promotionsRepository.findAll).toHaveBeenCalledWith({ filters: { id: 1 } });
      expect(promotionsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('Должен выбросить HTTPError для некорректного ID', async () => {
      await expect(promotionsService.deletePromotion(NaN)).rejects.toThrowError(
        new HTTPError(400, MESSAGES.INVALID_FORMAT),
      );
      expect(promotionsRepository.findAll).not.toHaveBeenCalled();
      expect(promotionsRepository.delete).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError, если акция не найдена', async () => {
      promotionsRepository.findAll = jest.fn().mockResolvedValue({
        items: [],
        total: 0,
      });

      await expect(promotionsService.deletePromotion(999)).rejects.toThrowError(
        new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
      );
      expect(promotionsRepository.findAll).toHaveBeenCalledWith({ filters: { id: 999 } });
      expect(promotionsRepository.delete).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError при попытке удаления активной акции', async () => {
      promotionsRepository.findAll = jest.fn().mockResolvedValue({
        items: [mockActivePromotion],
        total: 1,
      });

      await expect(promotionsService.deletePromotion(2)).rejects.toThrowError(
        new HTTPError(400, MESSAGES.CANNOT_DELETE_ACTIVE_PROMOTION),
      );
      expect(promotionsRepository.findAll).toHaveBeenCalledWith({ filters: { id: 2 } });
      expect(promotionsRepository.delete).not.toHaveBeenCalled();
    });

    it('Должен обрабатывать ошибки Prisma при поиске акции', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
        code: 'P2025',
        clientVersion: '1.0',
      });
      promotionsRepository.findAll = jest.fn().mockRejectedValue(prismaError);

      await expect(promotionsService.deletePromotion(1)).rejects.toThrowError(
        new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
      );
      expect(promotionsRepository.findAll).toHaveBeenCalledWith({ filters: { id: 1 } });
      expect(promotionsRepository.delete).not.toHaveBeenCalled();
    });

    it('Должен обрабатывать ошибки Prisma при удалении акции', async () => {
      promotionsRepository.findAll = jest.fn().mockResolvedValue({
        items: [mockPromotion],
        total: 1,
      });
      const prismaError = new Prisma.PrismaClientKnownRequestError('Error', {
        code: 'P2025',
        clientVersion: '1.0',
      });
      promotionsRepository.delete = jest.fn().mockRejectedValue(prismaError);

      await expect(promotionsService.deletePromotion(1)).rejects.toThrowError(
        new HTTPError(404, MESSAGES.PROMOTION_NOT_FOUND),
      );
      expect(promotionsRepository.findAll).toHaveBeenCalledWith({ filters: { id: 1 } });
      expect(promotionsRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('Получение всех акций', () => {
    it('Должен вернуть акции с фильтрами', async () => {
      promotionsRepository.findAll = jest.fn().mockResolvedValue({
        items: [mockPromotion],
        total: 1,
      });

      const result = await promotionsService.getAllPromotions({
        filters: { status: 'PENDING', active: 'true' },
        orderBy: { sortBy: 'title', sortOrder: 'asc' },
        pagination: { page: 1, limit: 10 },
      });

      expect(result).toEqual({ items: [mockPromotion], total: 1 });
      expect(promotionsRepository.findAll).toHaveBeenCalledWith({
        filters: { status: 'PENDING', endDate: expect.any(Object) },
        orderBy: { title: 'asc' },
        pagination: { page: 1, limit: 10 },
      });
    });

    it('Должен обрабатывать ошибки базы данных', async () => {
      promotionsRepository.findAll = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(promotionsService.getAllPromotions()).rejects.toThrowError(
        new HTTPError(500, MESSAGES.SERVER_ERROR),
      );
      expect(promotionsRepository.findAll).toHaveBeenCalledWith({
        filters: {},
        pagination: { page: 1, limit: 10 },
      });
    });
  });

  describe('Получение акций по поставщику', () => {
    it('Должен вернуть акции для поставщика', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
      promotionsRepository.findBySupplier = jest.fn().mockResolvedValue({
        items: [mockPromotion],
        total: 1,
      });

      const result = await promotionsService.getPromotionsBySupplier('test@example.com', {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({ items: [mockPromotion], total: 1 });
      expect(usersService.getUserInfo).toHaveBeenCalledWith('test@example.com');
      expect(promotionsRepository.findBySupplier).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
      });
    });

    it('Должен выбросить HTTPError, если email отсутствует', async () => {
      await expect(promotionsService.getPromotionsBySupplier(undefined)).rejects.toThrowError(
        new HTTPError(401, MESSAGES.UNAUTHORIZED),
      );
      expect(usersService.getUserInfo).not.toHaveBeenCalled();
      expect(promotionsRepository.findBySupplier).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError, если пользователь не найден', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(null);

      await expect(
        promotionsService.getPromotionsBySupplier('nonexistent@example.com'),
      ).rejects.toThrowError(new HTTPError(404, MESSAGES.USER_NOT_FOUND));
      expect(usersService.getUserInfo).toHaveBeenCalledWith('nonexistent@example.com');
      expect(promotionsRepository.findBySupplier).not.toHaveBeenCalled();
    });

    it('Должен выбросить HTTPError для ролей, не являющихся поставщиком', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockAdmin);

      await expect(
        promotionsService.getPromotionsBySupplier('admin@example.com'),
      ).rejects.toThrowError(new HTTPError(403, MESSAGES.SUPPLIER_ONLY));
      expect(usersService.getUserInfo).toHaveBeenCalledWith('admin@example.com');
      expect(promotionsRepository.findBySupplier).not.toHaveBeenCalled();
    });

    it('Должен обрабатывать ошибки базы данных', async () => {
      usersService.getUserInfo = jest.fn().mockResolvedValue(mockUser);
      promotionsRepository.findBySupplier = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(
        promotionsService.getPromotionsBySupplier('test@example.com', { page: 1, limit: 10 }),
      ).rejects.toThrowError(new HTTPError(500, MESSAGES.SERVER_ERROR));
      expect(usersService.getUserInfo).toHaveBeenCalledWith('test@example.com');
      expect(promotionsRepository.findBySupplier).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
      });
    });
  });
});