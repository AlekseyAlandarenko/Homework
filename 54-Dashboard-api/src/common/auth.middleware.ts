import { Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';
import { verify } from 'jsonwebtoken';

export class AuthMiddleware implements IMiddleware {
	constructor(private secret: string) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		if (req.headers.authorization) {
			const token = req.headers.authorization.split(' ')[1];

			verify(token, this.secret, (err, payload) => {
				if (err) {
					return next();
				}

				if (typeof payload === 'object' && 'email' in payload) {
					req.user = payload.email;
				}

				next();
			});

			return;
		}

		next();
	}
}
