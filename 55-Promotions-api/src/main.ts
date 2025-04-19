import { Container, ContainerModule, interfaces } from 'inversify';
import { App } from './app';
import { ExceptionFilter } from './errors/exception.filter';
import { LoggerService } from './logger/logger.service';
import { UsersController } from './users/users.controller';
import { PromotionsController } from './promotions/promotions.controller';
import { ILogger } from './logger/logger.interface';
import { TYPES } from './types';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { IUsersService } from './users/users.service.interface';
import { IUsersController } from './users/users.controller.interface';
import { IPromotionsController } from './promotions/promotions.controller.interface';
import { UsersService } from './users/users.service';
import { PromotionsService } from './promotions/promotions.service';
import { IConfigService } from './config/config.service.interface';
import { ConfigService } from './config/config.service';
import { PrismaService } from './database/prisma.service';
import { UsersRepository } from './users/users.repository';
import { PromotionsRepository } from './promotions/promotions.repository';
import { IUsersRepository } from './users/users.repository.interface';
import { IPromotionsRepository } from './promotions/promotions.repository.interface';
import { IPromotionsService } from './promotions/promotions.service.interface';
import { AuthMiddleware } from './common/auth.middleware';

export interface IBootstrapReturn {
	appContainer: Container;
	app: App;
}

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<IExceptionFilter>(TYPES.ExeptionFilter).to(ExceptionFilter);
	bind<IUsersController>(TYPES.UsersController).to(UsersController);
	bind<IPromotionsController>(TYPES.PromotionsController).to(PromotionsController);
	bind<IUsersService>(TYPES.UsersService).to(UsersService);
	bind<IPromotionsService>(TYPES.PromotionsService).to(PromotionsService);
	bind<PrismaService>(TYPES.PrismaService).to(PrismaService).inSingletonScope();
	bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
	bind<IUsersRepository>(TYPES.UsersRepository).to(UsersRepository).inSingletonScope();
	bind<IPromotionsRepository>(TYPES.PromotionsRepository).to(PromotionsRepository).inSingletonScope();
	bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();
	bind<App>(TYPES.Application).to(App);
});

async function bootstrap(): Promise<IBootstrapReturn> {
	const appContainer = new Container();
	appContainer.load(appBindings);
	const app = appContainer.get<App>(TYPES.Application);
	await app.init();
	return { appContainer, app };
}

export const boot = bootstrap();
