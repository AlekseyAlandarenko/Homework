import { inject, injectable } from 'inversify';
import { Telegraf, Context } from 'telegraf';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { ITelegramBotService } from './telegram-bot.service.interface';
import { IUsersService } from '../users/users.service.interface';
import { TelegramBotResponse } from './telegram-bot.service.interface';
import { ITelegramBotController } from './telegram-bot.controller.interface';
import { MESSAGES } from '../common/messages';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { PrismaService } from '../database/prisma.service';
import { CallbackHandler } from './callback.handler';
import { ILogger } from '../logger/logger.interface';
import { UserWithCategories } from '../users/users.repository.interface';
import { INotificationService } from '../notification/notification.service.interface';

export interface ExtendedContext extends Context {
	session: {
		awaitingCity?: boolean;
		awaitingCategories?: boolean;
		awaitingRemoveCategories?: boolean;
		selectedCategoryIds?: number[];
		categoryIdsToRemove?: number[];
		categoriesCache?: { id: number; name: string }[];
		page?: number;
		promotionPage?: number;
	};
	user: UserWithCategories;
	telegramId: string;
}

@injectable()
export class TelegramBotController implements ITelegramBotController {
	private bot: Telegraf<ExtendedContext>;

	constructor(
		@inject(TYPES.ConfigService) private readonly configService: IConfigService,
		@inject(TYPES.TelegramBotService) private readonly telegramService: ITelegramBotService,
		@inject(TYPES.PrismaService) private readonly prismaService: PrismaService,
		@inject(TYPES.CallbackHandler) private readonly callbackHandler: CallbackHandler,
		@inject(TYPES.UsersService) private readonly usersService: IUsersService,
		@inject(TYPES.NotificationService) private readonly notificationService: INotificationService,
		@inject(TYPES.ILogger) private readonly logger: ILogger,
	) {
		const token = this.configService.get('TELEGRAM_BOT_TOKEN');
		if (!token) {
			this.logger.error('TELEGRAM_BOT_TOKEN не установлен');
			throw new Error(MESSAGES.TELEGRAM_TOKEN_NOT_SET);
		}
		this.bot = new Telegraf<ExtendedContext>(token);
		this.notificationService.setBotInstance(this.bot);
		this.setupMiddlewares();
		this.setupCommands();
	}

	private async initializeSession(telegramId: string): Promise<ExtendedContext['session']> {
		const defaultSession: ExtendedContext['session'] = {
			page: 1,
			promotionPage: 1,
			awaitingCity: false,
			awaitingCategories: false,
			awaitingRemoveCategories: false,
			selectedCategoryIds: [],
			categoryIdsToRemove: [],
			categoriesCache: [],
		};
		await this.prismaService.client.telegramSession.create({
			data: {
				telegramId,
				data: defaultSession,
			},
		});
		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(`Создание новой сессии для пользователя ${telegramId}`);
		}
		return defaultSession;
	}

	private async setupMiddlewares(): Promise<void> {
		this.bot.use(async (ctx: ExtendedContext, next) => {
			const telegramId = ctx.from?.id.toString();
			if (!telegramId) {
				this.logger.error('telegramId не найден в контексте');
				await this.sendResponse(
					ctx,
					this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_ERROR),
					false,
				);
				return;
			}
			ctx.telegramId = telegramId;
			await next();
		});

		this.bot.use(async (ctx: ExtendedContext, next) => {
			const telegramId = ctx.telegramId;
			let user = await this.usersService.getUserInfoByTelegramId(telegramId);
			if (!user) {
				const username = ctx.from?.username || ctx.from?.first_name || 'Пользователь';
				if (process.env.DEBUG_LOGGING === 'true') {
					this.logger.log(`Создание нового пользователя: ${username} (${telegramId})`);
				}
				user = await this.usersService.createTelegramUser(telegramId, username);
			}
			ctx.user = user;

			let session = await this.prismaService.client.telegramSession.findUnique({
				where: { telegramId },
			});

			ctx.session =
				session && typeof session.data === 'object'
					? {
							page: (session.data as any).page ?? 1,
							promotionPage: (session.data as any).promotionPage ?? 1,
							awaitingCity: (session.data as any).awaitingCity ?? false,
							awaitingCategories: (session.data as any).awaitingCategories ?? false,
							awaitingRemoveCategories: (session.data as any).awaitingRemoveCategories ?? false,
							selectedCategoryIds: (session.data as any).selectedCategoryIds ?? [],
							categoryIdsToRemove: (session.data as any).categoryIdsToRemove ?? [],
							categoriesCache: (session.data as any).categoriesCache ?? [],
						}
					: await this.initializeSession(telegramId);

			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(`Сессия инициализирована: ${JSON.stringify(ctx.session)}`);
			}

			try {
				await next();
			} finally {
				try {
					await this.prismaService.client.telegramSession.update({
						where: { telegramId },
						data: { data: ctx.session },
					});
					if (process.env.DEBUG_LOGGING === 'true') {
						this.logger.log(`Сессия обновлена для пользователя ${telegramId}`);
					}
				} catch (error) {
					this.logger.error(`Ошибка обновления сессии для пользователя ${telegramId}: ${error}`);
				}
			}
		});
	}

	private setupCommands(): void {
		this.bot.command('start', (ctx) =>
			this.executeCommand(ctx, () => this.telegramService.handleStartCommand(ctx), 'start', false),
		);
		this.bot.command('setcity', (ctx) =>
			this.executeCommand(
				ctx,
				() => this.telegramService.handleSetCityCommand(ctx),
				'setcity',
				false,
			),
		);
		this.bot.command('viewcity', (ctx) =>
			this.executeCommand(
				ctx,
				() => this.telegramService.handleViewCityCommand(ctx),
				'viewcity',
				false,
			),
		);
		this.bot.command('setcategories', (ctx) =>
			this.executeCommand(
				ctx,
				() => this.telegramService.handleSetCategoriesCommand(ctx),
				'setcategories',
				false,
			),
		);
		this.bot.command('viewcategories', (ctx) =>
			this.executeCommand(
				ctx,
				() => this.telegramService.handleViewCategoriesCommand(ctx),
				'viewcategories',
				false,
			),
		);
		this.bot.command('removecategories', (ctx) =>
			this.executeCommand(
				ctx,
				() => this.telegramService.handleRemoveCategoriesCommand(ctx),
				'removecategories',
				false,
			),
		);
		this.bot.command('promotions', (ctx) =>
			this.executeCommand(
				ctx,
				() => this.telegramService.handlePromotionsCommand(ctx),
				'promotions',
				false,
			),
		);
		this.bot.command('disable_notifications', (ctx) =>
			this.executeCommand(
				ctx,
				() => this.telegramService.handleDisableNotificationsCommand(ctx),
				'disable_notifications',
				false,
			),
		);
		this.bot.command('help', (ctx) =>
			this.executeCommand(ctx, () => this.telegramService.handleHelpCommand(ctx), 'help', false),
		);
		this.bot.command('commands', (ctx) =>
			this.executeCommand(
				ctx,
				() => this.telegramService.handleCommandsCommand(ctx),
				'commands',
				false,
			),
		);

		this.bot.on('callback_query', async (ctx) => {
			const callbackQuery = ctx.callbackQuery as CallbackQuery;
			if (!callbackQuery || !('data' in callbackQuery)) {
				this.logger.warn('Недействительный callback запрос');
				await this.sendResponse(
					ctx,
					this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_CALLBACK),
					true,
				);
				return;
			}
			await this.executeCommand(
				ctx,
				() => this.callbackHandler.handle(ctx, callbackQuery.data),
				'callback_query',
				true,
			);
		});
	}

	private async executeCommand(
		ctx: ExtendedContext,
		handler: () => Promise<TelegramBotResponse | null>,
		commandName: string,
		isCallback: boolean = false,
	): Promise<void> {
		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(`Выполнение команды: ${commandName}`);
		}
		try {
			const response = await handler();
			await this.sendResponse(ctx, response, isCallback);
		} catch (error) {
			const message = error instanceof Error ? error.message : MESSAGES.TELEGRAM_ERROR;
			this.logger.error(`Ошибка в команде ${commandName}: ${message}`);
			await this.sendResponse(ctx, this.telegramService.createErrorResponse(message), false);
		}
	}

	private async sendResponse(
		ctx: ExtendedContext,
		response: TelegramBotResponse | null,
		isCallback: boolean = false,
	): Promise<void> {
		if (!response) {
			if (isCallback) {
				await ctx.answerCbQuery();
			}
			return;
		}
		const { message, keyboard, format, editMessage } = response;
		let replyOptions = {};
		if (keyboard) {
			if ('inline_keyboard' in keyboard) {
				replyOptions = { reply_markup: keyboard };
			} else if (!isCallback) {
				replyOptions = { reply_markup: keyboard };
			}
		}
		try {
			if (isCallback && editMessage && ctx.callbackQuery?.message) {
				await ctx.editMessageText(
					message,
					format === 'markdown' ? { ...replyOptions, parse_mode: 'Markdown' } : replyOptions,
				);
				await ctx.answerCbQuery();
			} else {
				if (format === 'markdown') {
					await ctx.replyWithMarkdown(message, replyOptions);
				} else {
					await ctx.reply(message, replyOptions);
				}
				if (isCallback) {
					await ctx.answerCbQuery();
				}
			}
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.logger.error(`Ошибка отправки ответа: ${err.message}`);
			if (err.message.includes("message can't be edited")) {
				try {
					if (format === 'markdown') {
						await ctx.replyWithMarkdown(message, replyOptions);
					} else {
						await ctx.reply(message, replyOptions);
					}
					if (isCallback) {
						await ctx.answerCbQuery();
					}
				} catch (retryError) {
					this.logger.error(`Ошибка при отправке нового сообщения: ${retryError}`);
					throw retryError;
				}
			} else if (err.message.includes('message is not modified') && isCallback) {
				await ctx.answerCbQuery();
			} else if (err.message.includes('inline keyboard expected') && (isCallback || editMessage)) {
				if (format === 'markdown') {
					await ctx.replyWithMarkdown(message, replyOptions);
				} else {
					await ctx.reply(message, replyOptions);
				}
				if (isCallback) {
					await ctx.answerCbQuery();
				}
			} else {
				throw err;
			}
		}
	}

	public async launch(): Promise<void> {
		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log('Запуск Telegram бота');
		}
		await this.bot.launch();
	}

	public async stop(): Promise<void> {
		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log('Остановка Telegram бота');
		}
		this.bot.stop();
	}
}
