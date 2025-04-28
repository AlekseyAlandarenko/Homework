import { Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from './messages';

export class RoleGuard implements IMiddleware {
	constructor(private roles: string[]) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		if (!req.user) {
			return next(new HTTPError(401, MESSAGES.UNAUTHORIZED));
		}
		if (!this.roles.includes(req.user.role)) {
			return next(new HTTPError(403, MESSAGES.FORBIDDEN));
		}
		next();
	}
}
