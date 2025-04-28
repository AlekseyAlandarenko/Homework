import { NextFunction, Request, Response } from 'express';

export interface IProductsController {
    create(req: Request, res: Response, next: NextFunction): void;
    getAll(req: Request, res: Response, next: NextFunction): void;
    getMyProducts(req: Request, res: Response, next: NextFunction): void;
    getAllForManager(req: Request, res: Response, next: NextFunction): void;
    getProductStatus(req: Request, res: Response, next: NextFunction): void;
    update(req: Request, res: Response, next: NextFunction): void;
    addQuantity(req: Request, res: Response, next: NextFunction): void;
    purchase(req: Request, res: Response, next: NextFunction): void;
    delete(req: Request, res: Response, next: NextFunction): void;
}