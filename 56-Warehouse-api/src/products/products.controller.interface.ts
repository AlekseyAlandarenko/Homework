import { NextFunction, Request, Response } from 'express';

export interface IProductsController {
	createProduct(req: Request, res: Response, next: NextFunction): void;
	getAllProducts(req: Request, res: Response, next: NextFunction): void;
	getMyProducts(req: Request, res: Response, next: NextFunction): void;
	getStock(req: Request, res: Response, next: NextFunction): void;
	getProductById(req: Request, res: Response, next: NextFunction): void;
	updateProduct(req: Request, res: Response, next: NextFunction): void;
	updateProductQuantity(req: Request, res: Response, next: NextFunction): void;
	purchaseProduct(req: Request, res: Response, next: NextFunction): void;
	deleteProduct(req: Request, res: Response, next: NextFunction): void;
}
