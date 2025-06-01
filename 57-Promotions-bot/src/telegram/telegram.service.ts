import { injectable, inject } from 'inversify';
import { Telegraf, Context } from 'telegraf';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { IUsersService } from '../users/users.service.interface';
import { IPromotionsService } from '../promotions/promotions.service.interface';
import { UserRegisterDto } from '../users/dto/user-register.dto';
import { PromotionCreateOrProposeDto } from '../promotions/dto/promotion-create-or-propose.dto';
import { PromotionUpdateDto } from '../promotions/dto/promotion-update.dto';
import { MESSAGES } from '../common/messages';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { HTTPError } from '../errors/http-error.class';
import { ITelegramBotService } from './telegram.service.interface';
import { ILogger } from '../logger/logger.interface';
import { PromotionModel } from '@prisma/client';

@injectable()
export class TelegramBotService implements ITelegramBotService {
  private bot: Telegraf;
  private awaitingPromotionData: Map<
    string,
    {
      operation: 'create' | 'update' | 'delete' | 'awaiting_update_id' | 'awaiting_delete_id';
      promotionId?: number;
      user?: { id: number; email: string; role: string };
      promotion?: PromotionModel;
    }
  > = new Map();

  constructor(
    @inject(TYPES.ConfigService) private configService: IConfigService,
    @inject(TYPES.UsersService) private usersService: IUsersService,
    @inject(TYPES.PromotionsService) private promotionsService: IPromotionsService,
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

    this.bot.command('promotions', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_PROMOTIONS_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handlePromotionsCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_PROMOTIONS_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.command('create_promotion', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_CREATE_PROMOTION_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleCreatePromotionCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_CREATE_PROMOTION_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.command('update_promotion', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_UPDATE_PROMOTION_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleUpdatePromotionCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_UPDATE_PROMOTION_ERROR} ${error}`);
        await ctx.reply(MESSAGES.TELEGRAM_ERROR);
      }
    });

    this.bot.command('delete_promotion', async (ctx) => {
      try {
        this.logger.log(`${MESSAGES.TELEGRAM_DELETE_PROMOTION_COMMAND_HANDLED} ${ctx.from?.id}`);
        await this.handleDeletePromotionCommand(ctx);
      } catch (error) {
        this.logger.error(`${MESSAGES.TELEGRAM_DELETE_PROMOTION_ERROR} ${error}`);
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
        await this.handlePromotionDataInput(ctx);
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
      user = await this.usersService.createUser(registerDto, 'SUPPLIER');
      await this.usersService.updateTelegramId(user.id, telegramId);
    }

    await ctx.reply(MESSAGES.TELEGRAM_WELCOME.replace('{{username}}', username));
  }

  private async handlePromotionsCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    const result = await this.promotionsService.getPromotionsBySupplier(`${telegramId}@telegram.com`);
    if (result.items.length === 0) {
      await ctx.reply(MESSAGES.TELEGRAM_NO_PROMOTIONS);
      return;
    }

    const response = result.items
      .map(
        (p) =>
          `ID: ${p.id}\nНазвание: ${p.title}\nОписание: ${p.description}\nСтатус: ${p.status}\nС ${p.startDate.toLocaleDateString()} по ${p.endDate.toLocaleDateString()}`,
      )
      .join('\n\n');
    await ctx.reply(response);
  }

  private async handleCreatePromotionCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new HTTPError(404, MESSAGES.TELEGRAM_USER_NOT_FOUND);
    }

    this.awaitingPromotionData.set(telegramId, { operation: 'create', user });
    await ctx.reply(
      `${MESSAGES.TELEGRAM_PROMOTION_INVALID_FORMAT}\nПример:\nНазвание: Скидка 10%\nОписание: Скидка на все товары\nДата начала: 2025-06-01\nДата окончания: 2025-06-30`,
    );
  }

  private async handleUpdatePromotionCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new HTTPError(404, MESSAGES.TELEGRAM_USER_NOT_FOUND);
    }

    this.awaitingPromotionData.set(telegramId, { operation: 'awaiting_update_id', user });
    await ctx.reply(MESSAGES.TELEGRAM_ENTER_PROMOTION_ID_FOR_UPDATE);
  }

  private async handleDeletePromotionCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      throw new HTTPError(404, MESSAGES.TELEGRAM_USER_NOT_FOUND);
    }

    this.awaitingPromotionData.set(telegramId, { operation: 'awaiting_delete_id', user });
    await ctx.reply(MESSAGES.TELEGRAM_ENTER_PROMOTION_ID_FOR_DELETE);
  }

  private async handlePromotionDataInput(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);
    const state = this.awaitingPromotionData.get(telegramId);
    if (!state || !state.user) {
      return;
    }

    const message = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    if (!message) {
      await ctx.reply(
        `${MESSAGES.TELEGRAM_PROMOTION_INVALID_FORMAT}\nПример:\nНазвание: Скидка 10%\nОписание: Скидка на все товары\nДата начала: 2025-06-01\nДата окончания: 2025-06-30`,
      );
      return;
    }

    const user = state.user;

    if (state.operation === 'awaiting_update_id') {
      const input = message.trim();
      if (!/^\d+$/.test(input)) {
        await ctx.reply(MESSAGES.TELEGRAM_INVALID_PROMOTION_ID);
        this.awaitingPromotionData.delete(telegramId);
        return;
      }

      const promotionId = parseInt(message.trim(), 10);
      try {
        const promotion = await this.promotionsService.getPromotionById(promotionId, user.id, user.role);
        if (!promotion) {
          await ctx.reply(MESSAGES.TELEGRAM_PROMOTION_NOT_FOUND);
          this.awaitingPromotionData.delete(telegramId);
          return;
        }

        if (
          user.role === 'SUPPLIER' &&
          (promotion.status !== 'PENDING' || promotion.supplierId !== user.id)
        ) {
          await ctx.reply(MESSAGES.TELEGRAM_ACCESS_DENIED);
          this.awaitingPromotionData.delete(telegramId);
          return;
        }

        this.awaitingPromotionData.set(telegramId, { operation: 'update', promotionId, user, promotion });
        await ctx.reply(
          `${MESSAGES.TELEGRAM_PROMOTION_INVALID_FORMAT}\nПример:\nНазвание: Скидка 10%\nОписание: Скидка на все товары\nДата начала: 2025-06-01\nДата окончания: 2025-06-30`,
        );
      } catch (error) {
        if (error instanceof Error && error.message === MESSAGES.PROMOTION_NOT_FOUND) {
          await ctx.reply(MESSAGES.TELEGRAM_PROMOTION_NOT_FOUND);
          this.awaitingPromotionData.delete(telegramId);
          return;
        }
        throw error;
      }
      return;
    }

    if (state.operation === 'awaiting_delete_id') {
      const input = message.trim();
      if (!/^\d+$/.test(input)) {
        await ctx.reply(MESSAGES.TELEGRAM_INVALID_PROMOTION_ID);
        this.awaitingPromotionData.delete(telegramId);
        return;
      }

      const promotionId = parseInt(message.trim(), 10);
      try {
        await this.promotionsService.deletePromotion(promotionId);
        await ctx.reply(MESSAGES.TELEGRAM_PROMOTION_DELETED);
        this.awaitingPromotionData.delete(telegramId);
      } catch (error) {
        if (error instanceof HTTPError && error.message === MESSAGES.PROMOTION_NOT_FOUND) {
          await ctx.reply(MESSAGES.TELEGRAM_PROMOTION_NOT_FOUND);
          this.awaitingPromotionData.delete(telegramId);
          return;
        }
        if (
          error instanceof HTTPError &&
          error.message === MESSAGES.CANNOT_DELETE_ACTIVE_PROMOTION
        ) {
          await ctx.reply(MESSAGES.TELEGRAM_CANNOT_DELETE_ACTIVE_PROMOTION);
          this.awaitingPromotionData.delete(telegramId);
          return;
        }
        throw error;
      }
      return;
    }

    const lines = message.split('\n');
    if (lines.length < 4) {
      await ctx.reply(
        `${MESSAGES.TELEGRAM_PROMOTION_INVALID_FORMAT}\nПример:\nНазвание: Скидка 10%\nОписание: Скидка на все товары\nДата начала: 2025-06-01\nДата окончания: 2025-06-30`,
      );
      return;
    }

    const title = lines[0].replace('Название: ', '').trim();
    const description = lines[1].replace('Описание: ', '').trim();
    const startDateStr = lines[2].replace('Дата начала: ', '').trim();
    const endDateStr = lines[3].replace('Дата окончания: ', '').trim();

    if (state.operation === 'create') {
      const createDto = plainToClass(PromotionCreateOrProposeDto, {
        title,
        description,
        startDate: startDateStr,
        endDate: endDateStr,
        isDeleted: false,
      });

      const createErrors = await validate(createDto);
      if (createErrors.length > 0) {
        const errorMessage = createErrors[0].constraints
          ? Object.values(createErrors[0].constraints)[0]
          : MESSAGES.VALIDATION_ERROR;
        await ctx.reply(MESSAGES.TELEGRAM_VALIDATION_FAILED.replace('{{error}}', errorMessage));
        this.awaitingPromotionData.delete(telegramId);
        return;
      }

      try {
        await this.promotionsService.createPromotion({
          ...createDto,
          userEmail: user.email,
          status: 'PENDING',
        });
        await ctx.reply(MESSAGES.TELEGRAM_PROMOTION_CREATED);
      } catch (error) {
        throw error;
      }
    } else if (state.operation === 'update') {
      const updateDto = plainToClass(PromotionUpdateDto, {
        title,
        description,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      const updateErrors = await validate(updateDto);
      if (updateErrors.length > 0) {
        const errorMessage = updateErrors[0].constraints
          ? Object.values(updateErrors[0].constraints)[0]
          : MESSAGES.VALIDATION_ERROR;
        await ctx.reply(MESSAGES.TELEGRAM_VALIDATION_FAILED.replace('{{error}}', errorMessage));
        this.awaitingPromotionData.delete(telegramId);
        return;
      }

      const promotionId = state.promotionId!;
      try {
        await this.promotionsService.updatePromotion(promotionId, updateDto);
        await ctx.reply(MESSAGES.TELEGRAM_PROMOTION_UPDATED);
      } catch (error) {
        if (error instanceof HTTPError && error.message === MESSAGES.PROMOTION_NOT_FOUND) {
          await ctx.reply(MESSAGES.TELEGRAM_PROMOTION_NOT_FOUND);
          this.awaitingPromotionData.delete(telegramId);
          return;
        }
        throw error;
      }
    }

    this.awaitingPromotionData.delete(telegramId);
  }

  private async handleCancelCommand(ctx: Context): Promise<void> {
    const telegramId = this.getTelegramIdOrThrow(ctx);

    if (this.awaitingPromotionData.has(telegramId)) {
      this.awaitingPromotionData.delete(telegramId);
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