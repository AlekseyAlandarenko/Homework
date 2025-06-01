import { UserModel } from '@prisma/client';
import { User } from './user.entity';
import { PaginatedResponse } from '../common/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

/**
 * @swagger
 * components:
 *   schemas:
 *     SupplierResponse:
 *       type: object
 *       description: Данные пользователя с ролью SUPPLIER, возвращаемые в ответах API (без пароля).
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор пользователя.
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: Электронная почта пользователя. Уникальна.
 *           example: supplier@example.com
 *         name:
 *           type: string
 *           description: Имя пользователя.
 *           example: Иван Иванов
 *         role:
 *           type: string
 *           enum: [SUPERADMIN, ADMIN, SUPPLIER]
 *           description: Роль пользователя (SUPPLIER для управления акциями и товарами).
 *           example: SUPPLIER
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания пользователя (ISO 8601).
 *           example: "2023-05-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления пользователя (ISO 8601).
 *           example: "2023-05-02T12:00:00Z"
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 */
export type SupplierResponse = Omit<UserModel, 'password'>;

export interface IUsersRepository {
	createUser(user: User): Promise<UserModel>;
	findByEmail(email: string): Promise<UserModel | null>;
	findByEmailOrThrow(email: string): Promise<UserModel>;
	findById(id: number): Promise<UserModel | null>;
	findByIdOrThrow(id: number): Promise<UserModel>;
	findAllSuppliers(params?: PaginationDto): Promise<PaginatedResponse<SupplierResponse>>;
	updateUser(id: number, data: Partial<UserModel>): Promise<UserModel>;
	deleteUser(id: number): Promise<UserModel>;
}
