import { NextFunction, Request, Response } from 'express';

export interface IPromotionsController {
	createPromotion(req: Request, res: Response, next: NextFunction): Promise<void>;
	getAllPromotions(req: Request, res: Response, next: NextFunction): Promise<void>;
	getMyPromotions(req: Request, res: Response, next: NextFunction): Promise<void>;
	getPromotionById(req: Request, res: Response, next: NextFunction): Promise<void>;
	updatePromotion(req: Request, res: Response, next: NextFunction): Promise<void>;
	updatePromotionStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
	deletePromotion(req: Request, res: Response, next: NextFunction): Promise<void>;
}
