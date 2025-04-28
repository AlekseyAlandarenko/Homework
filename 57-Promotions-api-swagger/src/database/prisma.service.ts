import { PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { MESSAGES } from '../common/messages';

@injectable()
export class PrismaService {
	client: PrismaClient;

	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		this.client = new PrismaClient();
	}

	async connect(): Promise<void> {
		try {
			await this.client.$connect();
			this.logger.log(MESSAGES.PRISMA_DB_CONNECT_SUCCESS);
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(`${MESSAGES.PRISMA_DB_CONNECT_FAILED} ${e.message}`);
			}
		}
	}

	async disconnect(): Promise<void> {
		await this.client.$disconnect();
	}
}