import { NextFunction, Request, Response } from 'express';

export interface IUsersController {
	createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
	login(req: Request, res: Response, next: NextFunction): void;
	getAllWarehouseManagers(req: Request, res: Response, next: NextFunction): void;
	updateWarehouseManagerPassword(req: Request, res: Response, next: NextFunction): void;
	deleteWarehouseManager(req: Request, res: Response, next: NextFunction): void;
}
