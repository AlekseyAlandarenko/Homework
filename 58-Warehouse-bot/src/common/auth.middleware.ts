import { Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';
import { verify } from 'jsonwebtoken';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { IConfigService } from '../config/config.service.interface';
import { MESSAGES } from '../common/messages';
import { Role } from './enums/role.enum';

@injectable()
export class AuthMiddleware implements IMiddleware {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.ILogger) private logger: ILogger,
	) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		if (!req.headers.authorization) {
			return next();
		}

		const token = req.headers.authorization.split(' ')[1];
		verify(token, this.configService.get('SECRET'), (err, payload) => {
			if (err) {
				this.logger.error(MESSAGES.TOKEN_VERIFICATION_FAILED);
				return res.status(401).send({ error: MESSAGES.INVALID_TOKEN });
			}

			if (
				typeof payload === 'object' &&
				'id' in payload &&
				'email' in payload &&
				'role' in payload
			) {
				req.user = {
					id: payload.id as number,
					email: payload.email as string,
					role: payload.role as Role,
				};
				this.logger.log(MESSAGES.AUTHENTICATION_SUCCESS);
			} else {
				this.logger.warn(MESSAGES.INVALID_TOKEN_PAYLOAD);
				return res.status(401).send({ error: MESSAGES.INVALID_TOKEN });
			}

			next();
		});
	}
}
