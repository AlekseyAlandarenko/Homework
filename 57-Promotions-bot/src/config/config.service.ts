import { inject, injectable } from 'inversify';
import { IConfigService } from './config.service.interface';
import { config } from 'dotenv';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { MESSAGES } from '../common/messages';

@injectable()
export class ConfigService implements IConfigService {
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		const result = config();
		if (result.error) {
			this.logger.error(MESSAGES.CONFIG_ENV_READ_FAILED);
			throw new Error(MESSAGES.CONFIG_ENV_READ_FAILED);
		} else {
			this.logger.log(MESSAGES.CONFIG_ENV_LOADED);
		}
	}

	get(key: string): string {
		const value = process.env[key];
		if (!value || value.trim() === '') {
			this.logger.error(MESSAGES.CONFIG_KEY_NOT_SET);
			throw new Error(MESSAGES.CONFIG_KEY_NOT_SET);
		}
		return value;
	}
}
