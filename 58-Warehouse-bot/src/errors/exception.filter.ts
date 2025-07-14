import { NextFunction, Request, Response } from 'express';
import { IExceptionFilter } from './exception.filter.interface';
import { HTTPError } from './http-error.class';
import { inject, injectable } from 'inversify';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';
import 'reflect-metadata';
import { MESSAGES } from '../common/messages';

@injectable()
export class ExceptionFilter implements IExceptionFilter {
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {}

	catch(err: Error | HTTPError, req: Request, res: Response, next: NextFunction): void {
		if (err instanceof HTTPError) {
			this.logger.error(MESSAGES.HTTP_ERROR_LOG);
			res.status(err.statusCode).send({ error: err.message });
		} else {
			this.logger.error(MESSAGES.SERVER_ERROR_LOG);
			res.status(500).send({ error: MESSAGES.SERVER_ERROR });
		}
	}
}
