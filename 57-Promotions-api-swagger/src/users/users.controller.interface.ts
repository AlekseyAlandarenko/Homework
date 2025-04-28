import { NextFunction, Request, Response } from 'express';

export interface IUsersController {
	registerAdmin(req: Request, res: Response, next: NextFunction): void;
	registerSupplier(req: Request, res: Response, next: NextFunction): void;
	login(req: Request, res: Response, next: NextFunction): void;
	getAllSuppliers(req: Request, res: Response, next: NextFunction): void;
	updateSupplierPassword(req: Request, res: Response, next: NextFunction): void;
	deleteSupplier(req: Request, res: Response, next: NextFunction): void;
}
