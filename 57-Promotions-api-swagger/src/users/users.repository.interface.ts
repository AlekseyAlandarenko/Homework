import { UserModel } from '@prisma/client';
import { User } from './user.entity';

/**
 * @swagger
 * components:
 *   schemas:
 *     SupplierResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           example: supplier@example.com
 *         name:
 *           type: string
 *           example: Иван Иванов
 *         role:
 *           type: string
 *           enum: [SUPERADMIN, ADMIN, SUPPLIER]
 *           example: SUPPLIER
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
export type SupplierResponse = Omit<UserModel, 'password'>;

export interface IUsersRepository {
  create(user: User): Promise<UserModel>;
  find(email: string): Promise<UserModel | null>;
  findById(id: number): Promise<UserModel | null>;
  findAllSuppliers(params?: { page?: number; limit?: number }): Promise<{
    items: SupplierResponse[];
    total: number;
  }>;
  update(id: number, data: Partial<UserModel>): Promise<UserModel | null>;
  delete(id: number): Promise<UserModel | null>;
}
