import { UserModel } from '@prisma/client';
import { User } from './user.entity';

/**
 * @swagger
 * components:
 *   schemas:
 *     WarehouseManagerResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           example: warehouseManager@example.com
 *         name:
 *           type: string
 *           example: Иван Иванов
 *         role:
 *           type: string
 *           enum: [SUPERADMIN, ADMIN, WAREHOUSE_MANAGER]
 *           example: WAREHOUSE_MANAGER
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - id
 *         - email
 *         - role
 */
export type WarehouseManagerResponse = Omit<UserModel, 'password'>;

export interface IUsersRepository {
	create(user: User): Promise<UserModel>;
	find(email: string): Promise<UserModel | null>;
	findById(id: number): Promise<UserModel | null>;
	findAllWarehouseManagers(params?: { page?: number; limit?: number }): Promise<{
		items: WarehouseManagerResponse[];
		total: number;
	  }>;
	update(id: number, data: Partial<UserModel>): Promise<UserModel | null>;
	delete(id: number): Promise<UserModel | null>;
}
