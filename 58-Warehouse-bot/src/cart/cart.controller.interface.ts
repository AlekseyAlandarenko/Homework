import { Request, Response, NextFunction } from 'express';

export interface ICartController {
	addCartItem(req: Request, res: Response, next: NextFunction): Promise<void>;
	getCartItems(req: Request, res: Response, next: NextFunction): Promise<void>;
	checkoutCartItems(req: Request, res: Response, next: NextFunction): Promise<void>;
	removeCartItem(req: Request, res: Response, next: NextFunction): Promise<void>;
}
