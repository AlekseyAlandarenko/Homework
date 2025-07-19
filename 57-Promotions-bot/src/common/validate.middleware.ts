import { ClassConstructor, plainToClass } from 'class-transformer';
import { IMiddleware } from './middleware.interface';
import { NextFunction, Request, Response } from 'express';
import { validate } from 'class-validator';
import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';

export class ValidateMiddleware implements IMiddleware {
	constructor(private classToValidate: ClassConstructor<object>) {}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const data = req.method === 'GET' ? req.query : req.body;
			const instance = plainToClass(this.classToValidate, data);
			const errors = await validate(instance);

			if (errors.length > 0) {
				const errorMessage = errors[0].constraints
					? Object.values(errors[0].constraints)[0]
					: MESSAGES.VALIDATION_ERROR;
				throw new HTTPError(422, errorMessage);
			}

			next();
		} catch (error) {
			next(error);
		}
	}
}
