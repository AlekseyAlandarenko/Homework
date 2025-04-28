import { NextFunction, Request, Response } from 'express';

export interface IPromotionsController {
	create(req: Request, res: Response, next: NextFunction): void;
	propose(req: Request, res: Response, next: NextFunction): void;
	getAll(req: Request, res: Response, next: NextFunction): void;
	getMyPromotions(req: Request, res: Response, next: NextFunction): void;
	update(req: Request, res: Response, next: NextFunction): void;
	updateStatus(req: Request, res: Response, next: NextFunction): void;
	delete(req: Request, res: Response, next: NextFunction): void;
}
