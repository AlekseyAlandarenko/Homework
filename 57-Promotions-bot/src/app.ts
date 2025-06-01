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
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { ITelegramBotService } from './telegram/telegram.service.interface';

@injectable()
export class App {
	app: Express;
	server: Server | null;
	port: number;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.UsersController) private usersController: UsersController,
		@inject(TYPES.PromotionsController) private promotionsController: PromotionsController,
		@inject(TYPES.ExceptionFilter) private exceptionFilter: ExceptionFilter,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
		@inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware,
		@inject(TYPES.TelegramBotService) private telegramBotService: ITelegramBotService,
	) {
		this.app = express();
		this.port = Number(process.env.PORT) || 8000;
		this.server = null;
	}

	private setupSwagger(): void {
		const options = {
			definition: {
				openapi: '3.0.0',
				info: {
					title: 'Promotions API',
					version: '1.1.0',
					description: 'API для управления пользователями и акциями с Telegram-ботом',
				},
				servers: [{ url: `http://localhost:${this.port}` }],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
							bearerFormat: 'JWT',
						},
					},
				},
				security: [{ bearerAuth: [] }],
			},
			apis: [
				'./src/**/*.controller.ts',
				'./src/**/*.dto.ts',
				'./src/**/*.entity.ts',
				'./src/**/*.interface.ts',
				'./src/**/*.validator.ts',
			],
		};

		const specs = swaggerJSDoc(options);
		this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
	}

	useMiddleware(): void {
		this.app.use(json());
		this.setupSwagger();
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
		this.server = this.app.listen(this.port, () => {
			this.logger.log(`Сервер запущен на http://localhost:${this.port}`);
			this.logger.log(`Документация доступна на http://localhost:${this.port}/api-docs`);
		});
		if (process.env.NODE_ENV !== 'test') {
			await this.telegramBotService.launch();
		}
	}

	public async close(): Promise<void> {
		return new Promise((resolve) => {
			if (this.server) {
				this.server.close(async () => {
					this.logger.log('Сервер закрыт');
					await this.prismaService.disconnect();
					if (process.env.NODE_ENV !== 'test') {
						try {
							await this.telegramBotService.stop();
							this.logger.log('Telegram бот остановлен');
						} catch (error) {
							this.logger.error('Ошибка при остановке Telegram бота:', error);
						}
					}
					this.logger.log('Prisma отключен');
					this.server = null;
					resolve();
				});
			} else {
				resolve();
			}
		});
	}
}
