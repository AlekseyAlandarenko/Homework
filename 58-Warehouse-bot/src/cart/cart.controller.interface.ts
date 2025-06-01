import { Request, Response, NextFunction } from 'express';

export interface ICartController {
	addToCart(req: Request, res: Response, next: NextFunction): Promise<void>;
	getCart(req: Request, res: Response, next: NextFunction): Promise<void>;
	checkout(req: Request, res: Response, next: NextFunction): Promise<void>;
	removeFromCart(req: Request, res: Response, next: NextFunction): Promise<void>;
}
