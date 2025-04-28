import { UserModel } from '@prisma/client';
import { User } from './user.entity';

export type SupplierResponse = Omit<UserModel, 'password'>;

export interface IUsersRepository {
	create(user: User): Promise<UserModel>;
	find(email: string): Promise<UserModel | null>;
	findById(id: number): Promise<UserModel | null>;
	findAllSuppliers(): Promise<SupplierResponse[]>;
	update(id: number, data: Partial<UserModel>): Promise<UserModel | null>;
	delete(id: number): Promise<UserModel | null>;
}
