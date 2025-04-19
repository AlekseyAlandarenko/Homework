import { UserModel } from '@prisma/client';
import { User } from './user.entity';

export type WarehouseManagerResponse = Omit<UserModel, 'password'>;

export interface IUsersRepository {
	create(user: User): Promise<UserModel>;
	find(email: string): Promise<UserModel | null>;
	findById(id: number): Promise<UserModel | null>;
	findAllWarehouseManagers(): Promise<WarehouseManagerResponse[]>;
	update(id: number, data: Partial<UserModel>): Promise<UserModel | null>;
	delete(id: number): Promise<UserModel | null>;
}
