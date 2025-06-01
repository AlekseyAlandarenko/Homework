import { NextFunction, Request, Response } from 'express';

export interface IPromotionsController {
	createPromotion(req: Request, res: Response, next: NextFunction): void;
	getAllPromotions(req: Request, res: Response, next: NextFunction): void;
	getMyPromotions(req: Request, res: Response, next: NextFunction): void;
	getPromotionById(req: Request, res: Response, next: NextFunction): void;
	updatePromotion(req: Request, res: Response, next: NextFunction): void;
	updatePromotionStatus(req: Request, res: Response, next: NextFunction): void;
	deletePromotion(req: Request, res: Response, next: NextFunction): void;
}
