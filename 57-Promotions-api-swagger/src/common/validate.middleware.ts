import { ClassConstructor, plainToClass } from 'class-transformer';
import { IMiddleware } from './middleware.interface';
import { NextFunction, Request, Response } from 'express';
import { validate } from 'class-validator';
import { MESSAGES } from '../common/messages';

export class ValidateMiddleware implements IMiddleware {
	constructor(private classToValidate: ClassConstructor<object>) {}

	execute({ body }: Request, res: Response, next: NextFunction): void {
		const instance = plainToClass(this.classToValidate, body);
		validate(instance).then((errors) => {
			if (errors.length > 0) {
				const errorMessage = errors[0].constraints
					? Object.values(errors[0].constraints)[0]
					: MESSAGES.VALIDATION_ERROR;
				res.status(422).send({ error: errorMessage });
			} else {
				next();
			}
		});
	}
}