import { NextFunction, Request, Response } from 'express';

export interface IUsersController {
	createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
	getAllSuppliers(req: Request, res: Response, next: NextFunction): Promise<void>;
	updateSupplierPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
	updateUserProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
	deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void>;
	login(req: Request, res: Response, next: NextFunction): Promise<void>;
}
