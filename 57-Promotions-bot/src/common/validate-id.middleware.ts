import { Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

export class ValidateIdMiddleware implements IMiddleware {
	constructor(private paramName: string = 'id') {}

	execute(req: Request, res: Response, next: NextFunction): void {
		try {
			const id = Number(req.params[this.paramName]);
			if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
				throw new HTTPError(422, MESSAGES.CITY_ID_INVALID_INTEGER);
			}
			req.params[this.paramName] = id.toString();
			next();
		} catch (error) {
			next(error);
		}
	}
}
