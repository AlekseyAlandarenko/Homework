import { Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';

export class SetRoleMiddleware implements IMiddleware {
	constructor(private role: 'ADMIN' | 'SUPPLIER') {}

	execute(req: Request, res: Response, next: NextFunction): void {
		(req as any).targetRole = this.role;
		next();
	}
}
