import { Container, ContainerModule, interfaces } from 'inversify';
import { App } from './app';
import { ExceptionFilter } from './errors/exception.filter';
import { LoggerService } from './logger/logger.service';
import { UsersController } from './users/users.controller';
import { ProductsController } from './products/products.controller';
import { CartController } from './cart/cart.controller';
import { ILogger } from './logger/logger.interface';
import { TYPES } from './types';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { IUsersService } from './users/users.service.interface';
import { IUsersController } from './users/users.controller.interface';
import { IProductsController } from './products/products.controller.interface';
import { ICartController } from './cart/cart.controller.interface';
import { UsersService } from './users/users.service';
import { ProductsService } from './products/products.service';
import { CartService } from './cart/cart.service';
import { IConfigService } from './config/config.service.interface';
import { ConfigService } from './config/config.service';
import { PrismaService } from './database/prisma.service';
import { UsersRepository } from './users/users.repository';
import { ProductsRepository } from './products/products.repository';
import { CartRepository } from './cart/cart.repository';
import { IUsersRepository } from './users/users.repository.interface';
import { IProductsRepository } from './products/products.repository.interface';
import { ICartRepository } from './cart/cart.repository.interface';
import { IProductsService } from './products/products.service.interface';
import { ICartService } from './cart/cart.service.interface';
import { AuthMiddleware } from './common/auth.middleware';
import { TelegramBotService } from './telegram/telegram.service';
import { ITelegramBotService } from './telegram/telegram.service.interface';

export interface IBootstrapReturn {
	appContainer: Container;
	app: App;
}

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter);
	bind<IUsersController>(TYPES.UsersController).to(UsersController);
	bind<IProductsController>(TYPES.ProductsController).to(ProductsController);
	bind<ICartController>(TYPES.CartController).to(CartController);
	bind<IUsersService>(TYPES.UsersService).to(UsersService);
	bind<IProductsService>(TYPES.ProductsService).to(ProductsService);
	bind<ICartService>(TYPES.CartService).to(CartService);
	bind<PrismaService>(TYPES.PrismaService).to(PrismaService).inSingletonScope();
	bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
	bind<IUsersRepository>(TYPES.UsersRepository).to(UsersRepository).inSingletonScope();
	bind<IProductsRepository>(TYPES.ProductsRepository).to(ProductsRepository).inSingletonScope();
	bind<ICartRepository>(TYPES.CartRepository).to(CartRepository).inSingletonScope();
	bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();
	bind<ITelegramBotService>(TYPES.TelegramBotService).to(TelegramBotService).inSingletonScope();
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
