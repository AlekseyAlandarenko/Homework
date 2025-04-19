import express, { Express } from 'express';
import { Server } from 'http';
import { UsersController } from './users/users.controller';
import { PromotionsController } from './promotions/promotions.controller';
import { ExceptionFilter } from './errors/exception.filter';
import { ILogger } from './logger/logger.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { json } from 'body-parser';
import 'reflect-metadata';
import { PrismaService } from './database/prisma.service';
import { AuthMiddleware } from './common/auth.middleware';

@injectable()
export class App {
	app: Express;
	server!: Server;
	port: number;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.UsersController) private usersController: UsersController,
		@inject(TYPES.PromotionsController) private promotionsController: PromotionsController,
		@inject(TYPES.ExeptionFilter) private exceptionFilter: ExceptionFilter,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
		@inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware,
	) {
		this.app = express();
		this.port = 8000;
	}

	useMiddleware(): void {
		this.app.use(json());
		this.app.use(this.authMiddleware.execute.bind(this.authMiddleware));
	}

	useRoutes(): void {
		this.app.use('/users', this.usersController.router);
		this.app.use('/promotions', this.promotionsController.router);
	}

	useExceptionFilters(): void {
		this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
	}

	public async init(): Promise<void> {
		this.useMiddleware();
		this.useRoutes();
		this.useExceptionFilters();
		await this.prismaService.connect();
		this.server = this.app.listen(this.port);
		this.logger.log(`Сервер запущен на http://localhost:${this.port}`);
	}

	public async close(): Promise<void> {
		return new Promise((resolve) => {
			if (this.server) {
				this.server.close(async () => {
					this.logger.log('Сервер закрыт');
					await this.prismaService.disconnect();
					this.logger.log('Prisma отключен');
					resolve();
				});
			} else {
				resolve();
			}
		});
	}
}
