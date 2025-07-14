import { Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from './messages';
import { Role } from './enums/role.enum';

export class RoleGuard implements IMiddleware {
	static SUPPLIER: Role = Role.WAREHOUSE_MANAGER;
	constructor(private roles: readonly Role[]) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		if (!req.user) {
			return next(new HTTPError(401, MESSAGES.UNAUTHORIZED));
		}
		if (!this.roles.includes(req.user.role)) {
			return next(new HTTPError(403, MESSAGES.FORBIDDEN_ACCESS));
		}
		next();
	}
}
