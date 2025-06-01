import express, { Express } from 'express';
import { Server } from 'http';
import { UsersController } from './users/users.controller';
import { ProductsController } from './products/products.controller';
import { CartController } from './cart/cart.controller';
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

@injectable()
export class App {
	app: Express;
	server!: Server;
	port: number;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.UsersController) private usersController: UsersController,
		@inject(TYPES.ProductsController) private productsController: ProductsController,
		@inject(TYPES.CartController) private cartController: CartController,
		@inject(TYPES.ExceptionFilter) private exceptionFilter: ExceptionFilter,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
		@inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware,
	) {
		this.app = express();
		this.port = 8000;
	}

	private setupSwagger(): void {
		const options = {
			definition: {
				openapi: '3.0.0',
				info: {
					title: 'Warehouse API',
					version: '1.0.0',
					description: 'API для управления пользователями, товарами и корзиной',
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
					schemas: {},
				},
				security: [{ bearerAuth: [] }],
			},
			apis: [
				'./src/**/*.controller.ts',
				'./src/**/*.dto.ts',
				'./src/**/*.entity.ts',
				'./src/**/*.interface.ts',
			],
		};

		const specs = swaggerJSDoc(options);
		this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
	}

	useMiddleware(): void {
		this.app.use(json());
		this.app.use(this.authMiddleware.execute.bind(this.authMiddleware));
		this.setupSwagger();
	}

	useRoutes(): void {
		this.app.use('/users', this.usersController.router);
		this.app.use('/products', this.productsController.router);
		this.app.use('/cart', this.cartController.router);
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
		this.logger.log(`Документация доступна на http://localhost:${this.port}/api-docs`);
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
