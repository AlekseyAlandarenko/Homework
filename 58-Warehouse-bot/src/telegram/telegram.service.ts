import { injectable, inject } from 'inversify';
import { Telegraf, Context } from 'telegraf';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { IUsersService } from '../users/users.service.interface';
import { IProductsService } from '../products/products.service.interface';
import { UserRegisterDto } from '../users/dto/user-register.dto';
import { ProductCreateDto } from '../products/dto/product-create.dto';
import { ProductUpdateDto } from '../products/dto/product-update.dto';
import { MESSAGES } from '../common/messages';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { HTTPError } from '../errors/http-error.class';
import { ITelegramBotService } from './telegram.service.interface';
import { ILogger } from '../logger/logger.interface';
import { ProductModel } from '@prisma/client';

@injectable()
export class TelegramBotService implements ITelegramBotService {
  private bot: Telegraf;
  private awaitingProductData: Map<
    string,
    {
      operation: 'create' | 'update' | 'delete' | 'awaiting_update_id' | 'awaiting_delete_id';
      productId?: number;
      user?: { id: number; email: string; role: string };
      product?: ProductModel;
    }
  > = new Map();

  constructor(
    @inject(TYPES.ConfigService) private configService: IConfigService,
    @inject(TYPES.UsersService) private usersService: IUsersService,
    @inject(TYPES.ProductsService) private productsService: IProductsService,
    @inject(TYPES.ILogger) private logger: ILogger,
  ) {
    const token = this.configService.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error(MESSAGES.TELEGRAM_TOKEN_NOT_SET);
    }
    this.bot = new Telegraf(token);
    this.setupBot();
  }

  private async setupBot(): Promise<void> {
    this.bot.start(async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_START_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleStartCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_START_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.command('products', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_PRODUCTS_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleProductsCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_PRODUCTS_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.command('create_product', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_CREATE_PRODUCT_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleCreateProductCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_CREATE_PRODUCT_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.command('update_product', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_UPDATE_PRODUCT_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleUpdateProductCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_UPDATE_PRODUCT_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.command('delete_product', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_DELETE_PRODUCT_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleDeleteProductCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_DELETE_PRODUCT_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.command('cancel', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_CANCEL_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleCancelCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_CANCEL_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.on('text', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_TEXT_INPUT_HANDLED} ${ctx.from?.id}`);
        await this.handleProductDataInput(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_TEXT_INPUT_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.logger.log(MESSAGES.TELEGRAM_COMMANDS_SETUP);
  }

  private getTelegramIdOrThrow(ctx: Context): string {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) {
      throw new HTTPError(400, MESSAGES.TELEGRAM_ID_NOT_FOUND);
    }
    return telegramId;
  }

  private async handleStartCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);
    const username = ctx.from?.username || 'Unknown';

    let user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      const email = `${telegramId}@telegram.com`;
      const password = `Pass${telegramId.slice(-4)}123`;
      const registerDto: UserRegisterDto = {
        email,
        name: username,
        password,
      };
      user = await this.usersService.createUser(registerDto, 'WAREHOUSE_MANAGER');
      await this.usersService.updateTelegramId(user.id, telegramId);
    }

    await ctx.reply(MESSAGES.TELEGRAM_WELCOME.replace('{{username}}', username));
  }

  private async handleProductsCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    const result = await this.productsService.getProductsByCreator(`${telegramId}@telegram.com`);
    if (result.items.length === 0) {
      await ctx.reply(MESSAGES.TELEGRAM_NO_PRODUCTS);
      return;
    }

    const response = result.items
      .map(
        (p) =>
          `ID: ${p.id}\nНазвание: ${p.name}\nОписание: ${p.description || 'Нет'}\nЦена: ${p.price}\nКоличество: ${p.quantity}\nКатегория: ${p.category || 'Нет'}\nАртикул: ${p.sku}`,
      )
      .join('\n\n');
    await ctx.reply(response);
  }

  private async handleCreateProductCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new HTTPError(404, MESSAGES.TELEGRAM_USER_NOT_FOUND);
    }

    this.awaitingProductData.set(telegramId, { operation: 'create', user });
    await ctx.reply(
      `${MESSAGES.TELEGRAM_PRODUCT_INVALID_FORMAT}\nПример:\nНазвание: Ноутбук HP EliteBook\nОписание: 15.6\", Core i7, 16GB RAM\nЦена: 1250.99\nКоличество: 10\nКатегория: Электроника\nАртикул: NB-HP-001`,
    );
  }

  private async handleUpdateProductCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new HTTPError(404, MESSAGES.TELEGRAM_USER_NOT_FOUND);
    }

    this.awaitingProductData.set(telegramId, { operation: 'awaiting_update_id', user });
    await ctx.reply(MESSAGES.TELEGRAM_ENTER_PRODUCT_ID_FOR_UPDATE);
  }

  private async handleDeleteProductCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new HTTPError(404, MESSAGES.TELEGRAM_USER_NOT_FOUND);
    }

    this.awaitingProductData.set(telegramId, { operation: 'awaiting_delete_id', user });
    await ctx.reply(MESSAGES.TELEGRAM_ENTER_PRODUCT_ID_FOR_DELETE);
  }

  private async handleProductDataInput(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);
    const state = this.awaitingProductData.get(telegramId);
    if (!state || !state.user) {
      return;
    }

    const message = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    if (!message) {
      await ctx.reply(
        `${MESSAGES.TELEGRAM_PRODUCT_INVALID_FORMAT}\nПример:\nНазвание: Ноутбук HP EliteBook\nОписание: 15.6\", Core i7, 16GB RAM\nЦена: 1250.99\nКоличество: 10\nКатегория: Электроника\nАртикул: NB-HP-001`,
      );
      return;
    }

    const user = state.user;

    if (state.operation === 'awaiting_update_id') {
      const input = message.trim();
      if (!/^\d+$/.test(input)) {
        await ctx.reply(MESSAGES.TELEGRAM_INVALID_PRODUCT_ID);
        this.awaitingProductData.delete(telegramId);
        return;
      }

      const productId = parseInt(message.trim(), 10);
      try {
        const product = await this.productsService.getProductById(productId, user.id, user.role);
        if (!product) {
          await ctx.reply(MESSAGES.TELEGRAM_PRODUCT_NOT_FOUND);
          this.awaitingProductData.delete(telegramId);
          return;
        }

        if (user.role === 'WAREHOUSE_MANAGER' && product.createdById !== user.id) {
          await ctx.reply(MESSAGES.TELEGRAM_ACCESS_DENIED);
          this.awaitingProductData.delete(telegramId);
          return;
        }

        this.awaitingProductData.set(telegramId, { operation: 'update', productId, user, product });
        await ctx.reply(
          `${MESSAGES.TELEGRAM_PRODUCT_INVALID_FORMAT}\nПример:\nНазвание: Ноутбук HP EliteBook\nОписание: 15.6\", Core i7, 16GB RAM\nЦена: 1250.99\nКоличество: 10\nКатегория: Электроника\nАртикул: NB-HP-001`,
        );
      } catch (error) {
        if (error instanceof Error && error.message === MESSAGES.PRODUCT_NOT_FOUND) {
          await ctx.reply(MESSAGES.TELEGRAM_PRODUCT_NOT_FOUND);
          this.awaitingProductData.delete(telegramId);
          return;
        }
        throw error;
      }
      return;
    }

    if (state.operation === 'awaiting_delete_id') {
      const input = message.trim();
      if (!/^\d+$/.test(input)) {
        await ctx.reply(MESSAGES.TELEGRAM_INVALID_PRODUCT_ID);
        this.awaitingProductData.delete(telegramId);
        return;
      }

      const productId = parseInt(message.trim(), 10);
      try {
        await this.productsService.deleteProduct(productId, user.email);
        await ctx.reply(MESSAGES.TELEGRAM_PRODUCT_DELETED);
        this.awaitingProductData.delete(telegramId);
      } catch (error) {
        if (error instanceof HTTPError && error.message === MESSAGES.PRODUCT_NOT_FOUND) {
          await ctx.reply(MESSAGES.TELEGRAM_PRODUCT_NOT_FOUND);
          this.awaitingProductData.delete(telegramId);
          return;
        }
        if (error instanceof HTTPError && error.message === MESSAGES.PRODUCT_NOT_ACTIVE) {
          await ctx.reply(MESSAGES.TELEGRAM_PRODUCT_NOT_ACTIVE);
          this.awaitingProductData.delete(telegramId);
          return;
        }
        throw error;
      }
      return;
    }

    const lines = message.split('\n');
    if (lines.length < 4) {
      await ctx.reply(
        `${MESSAGES.TELEGRAM_PRODUCT_INVALID_FORMAT}\nПример:\nНазвание: Ноутбук HP EliteBook\nОписание: 15.6\", Core i7, 16GB RAM\nЦена: 1250.99\nКоличество: 10\nКатегория: Электроника\nАртикул: NB-HP-001`,
      );
      return;
    }

    const name = lines[0].replace('Название: ', '').trim();
    const description = lines[1].replace('Описание: ', '').trim() || undefined;
    const priceStr = lines[2].replace('Цена: ', '').trim();
    const quantityStr = lines[3].replace('Количество: ', '').trim();
    const category = lines[4]?.replace('Категория: ', '').trim() || undefined;
    const sku = lines[5]?.replace('Артикул: ', '').trim();

    if (state.operation === 'create') {
      const createDto = plainToClass(ProductCreateDto, {
        name,
        description,
        price: parseFloat(priceStr),
        quantity: parseInt(quantityStr, 10),
        category,
        sku,
        isActive: true,
        isDeleted: false,
      });

      const createErrors = await validate(createDto);
      if (createErrors.length > 0) {
        const errorMessage = createErrors[0].constraints
          ? Object.values(createErrors[0].constraints)[0]
          : MESSAGES.VALIDATION_ERROR;
        await ctx.reply(MESSAGES.TELEGRAM_VALIDATION_FAILED.replace('{{error}}', errorMessage));
        this.awaitingProductData.delete(telegramId);
        return;
      }

      try {
        await this.productsService.createProduct({ ...createDto, userEmail: user.email });
        await ctx.reply(MESSAGES.TELEGRAM_PRODUCT_CREATED);
      } catch (error) {
        if (error instanceof HTTPError && error.message === MESSAGES.SKU_ALREADY_EXISTS) {
          await ctx.reply(MESSAGES.TELEGRAM_SKU_ALREADY_EXISTS);
          this.awaitingProductData.delete(telegramId);
          return;
        }
        throw error;
      }
    } else if (state.operation === 'update') {
      const updateDto = plainToClass(ProductUpdateDto, {
        name,
        description,
        price: parseFloat(priceStr),
        quantity: parseInt(quantityStr, 10),
        category,
        sku,
      });

      const updateErrors = await validate(updateDto);
      if (updateErrors.length > 0) {
        const errorMessage = updateErrors[0].constraints
          ? Object.values(updateErrors[0].constraints)[0]
          : MESSAGES.VALIDATION_ERROR;
        await ctx.reply(MESSAGES.TELEGRAM_VALIDATION_FAILED.replace('{{error}}', errorMessage));
        this.awaitingProductData.delete(telegramId);
        return;
      }

      const productId = state.productId!;
      try {
        await this.productsService.updateProduct(productId, updateDto, user.email);
        await ctx.reply(MESSAGES.TELEGRAM_PRODUCT_UPDATED);
      } catch (error) {
        if (error instanceof HTTPError && error.message === MESSAGES.SKU_ALREADY_EXISTS) {
          await ctx.reply(MESSAGES.TELEGRAM_SKU_ALREADY_EXISTS);
          this.awaitingProductData.delete(telegramId);
          return;
        }
        if (error instanceof HTTPError && error.message === MESSAGES.PRODUCT_NOT_FOUND) {
          await ctx.reply(MESSAGES.TELEGRAM_PRODUCT_NOT_FOUND);
          this.awaitingProductData.delete(telegramId);
          return;
        }
        if (error instanceof HTTPError && error.message === MESSAGES.QUANTITY_NEGATIVE) {
          await ctx.reply(MESSAGES.QUANTITY_NEGATIVE);
          this.awaitingProductData.delete(telegramId);
          return;
        }
        throw error;
      }
    }

    this.awaitingProductData.delete(telegramId);
  }

  private async handleCancelCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    if (this.awaitingProductData.has(telegramId)) {
      this.awaitingProductData.delete(telegramId);
      await ctx.reply(MESSAGES.TELEGRAM_CANCELED);
    } else {
      await ctx.reply(MESSAGES.TELEGRAM_NOTHING_TO_CANCEL);
    }
  }

  public async launch(): Promise<void> {
    this.logger.log(MESSAGES.TELEGRAM_BOT_STARTED);
    await this.bot.launch();
  }

  public async stop(): Promise<void> {
    this.bot.stop();
    this.logger.log(MESSAGES.TELEGRAM_BOT_STOPPED);
  }
}