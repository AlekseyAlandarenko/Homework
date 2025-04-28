import { NextFunction, Request, Response } from 'express';

export interface IUsersController {
	registerAdmin(req: Request, res: Response, next: NextFunction): void;
	registerWarehouseManager(req: Request, res: Response, next: NextFunction): void;
	login(req: Request, res: Response, next: NextFunction): void;
	getAllWarehouseManagers(req: Request, res: Response, next: NextFunction): void;
	updateWarehouseManagerPassword(req: Request, res: Response, next: NextFunction): void;
	deleteWarehouseManager(req: Request, res: Response, next: NextFunction): void;
}
