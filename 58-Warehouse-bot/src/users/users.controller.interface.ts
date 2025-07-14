import { NextFunction, Request, Response } from 'express';

export interface IUsersController {
	createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
	getAllWarehouseManagers(req: Request, res: Response, next: NextFunction): Promise<void>;
	getUserAddresses(req: Request, res: Response, next: NextFunction): Promise<void>;
	updateWarehouseManagerPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
	updateUserProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
	deleteWarehouseManager(req: Request, res: Response, next: NextFunction): Promise<void>;
	login(req: Request, res: Response, next: NextFunction): Promise<void>;
}
