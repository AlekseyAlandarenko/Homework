import { injectable, inject } from 'inversify';
import { ExtendedContext } from './telegram-bot.controller';
import { TelegramBotResponse } from './telegram-bot.service.interface';
import { ITelegramBotService } from './telegram-bot.service.interface';
import { IUsersService } from '../users/users.service.interface';
import { IPromotionsService } from '../promotions/promotions.service.interface';
import { TYPES } from '../types';
import { MESSAGES } from '../common/messages';
import { Markup } from 'telegraf';
import { PrismaService } from '../database/prisma.service';
import { UserUpdateProfileDto } from '../users/dto/user-update-profile.dto';
import { Role } from '../common/enums/role.enum';
import { TELEGRAM_ACTIONS, TELEGRAM_BUTTONS } from './telegram.constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PromotionWithRelations } from '../promotions/promotions.repository.interface';
import { DEFAULT_PAGINATION } from '../common/constants';
import { ILogger } from '../logger/logger.interface';
import { TelegramUtils } from './telegram.utils';

@injectable()
export class TelegramBotService implements ITelegramBotService {
	constructor(
		@inject(TYPES.UsersService) private readonly usersService: IUsersService,
		@inject(TYPES.PromotionsService) private readonly promotionsService: IPromotionsService,
		@inject(TYPES.PrismaService) private readonly prismaService: PrismaService,
		@inject(TYPES.TelegramUtils) private readonly telegramUtils: TelegramUtils,
		@inject(TYPES.ILogger) private readonly logger: ILogger,
	) {}

	createErrorResponse(message: string, editMessage: boolean = false): TelegramBotResponse {
		return {
			message,
			keyboard: this.createMainMenu(),
			format: 'plain',
			editMessage,
		};
	}

	private createCancelOnlyKeyboard(): { inline_keyboard: any[][] } {
		return {
			inline_keyboard: [
				[Markup.button.callback(TELEGRAM_BUTTONS.CANCEL, TELEGRAM_ACTIONS.CANCEL_ACTION)],
			],
		};
	}

	async handleStartCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const username = ctx.from?.username || ctx.from?.first_name || 'Пользователь';
		if (!ctx.user.cityId) {
			return this.handleSetCityCommand(ctx);
		}
		return {
			message:
				MESSAGES.TELEGRAM_WELCOME_BACK.replace('{{username}}', username) +
				'\n' +
				MESSAGES.TELEGRAM_USER_ACTIONS_PROMPT,
			keyboard: this.createMainMenu(),
			format: 'plain',
		};
	}

	async handleSetCityCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const cities = await this.prismaService.client.cityModel.findMany({
			select: { id: true, name: true },
		});
		if (!cities.length) {
			this.logger.warn(`Нет доступных городов для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_NO_CITIES_AVAILABLE);
		}
		this.telegramUtils.resetSessionFlags(ctx, { awaitingCity: true });
		return {
			message: MESSAGES.TELEGRAM_SELECT_CITY_PROMPT,
			keyboard: this.createInlineKeyboard(
				cities,
				(city) => city.name,
				(city) => `${TELEGRAM_ACTIONS.SELECT_CITY}_${city.id}`,
			),
			format: 'plain',
		};
	}

	async handleViewCityCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		if (!ctx.user.cityId) {
			this.logger.warn(`Город не выбран для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_NO_CITY_SELECTED);
		}
		const city = await this.prismaService.client.cityModel.findUnique({
			where: { id: ctx.user.cityId },
			select: { name: true },
		});
		return {
			message: `${MESSAGES.TELEGRAM_VIEW_CITY_PREFIX} ${city?.name ?? 'Неизвестный город'}`,
			keyboard: this.createInlineKeyboard([]),
			format: 'plain',
		};
	}

	async handleSetCategoriesCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const page = ctx.session.page || 1;
		const limit = 10;
		const [categories, total] = await Promise.all([
			this.prismaService.client.categoryModel.findMany({
				select: { id: true, name: true },
				skip: (page - 1) * limit,
				take: limit,
			}),
			this.prismaService.client.categoryModel.count(),
		]);
		if (!categories.length) {
			this.logger.warn(`Нет доступных категорий для пользователя ${ctx.telegramId}`);
			return this.handlePromotionsCommand(ctx);
		}
		this.telegramUtils.resetSessionFlags(ctx, {
			categoriesCache: categories,
			awaitingCategories: true,
			selectedCategoryIds: [],
			page,
		});
		return {
			message: MESSAGES.TELEGRAM_SELECT_CATEGORIES_PROMPT,
			keyboard: this.createInlineKeyboard(
				categories,
				(category) =>
					ctx.session.selectedCategoryIds?.includes(category.id)
						? `✅ ${category.name}`
						: category.name,
				(category) => `${TELEGRAM_ACTIONS.SELECT_CATEGORY}_${category.id}`,
				[
					{
						text: TELEGRAM_BUTTONS.FINISH_CATEGORIES,
						callback: TELEGRAM_ACTIONS.FINISH_CATEGORIES,
					},
				],
				{ page, totalPages: Math.ceil(total / limit), actionPrefix: TELEGRAM_ACTIONS.PREV_PAGE },
			),
			format: 'plain',
		};
	}

	async handleViewCategoriesCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const categories = await this.prismaService.client.categoryModel.findMany({
			where: { users: { some: { telegramId: ctx.telegramId } } },
			select: { name: true },
		});
		if (!categories.length) {
			this.logger.warn(`Нет выбранных категорий для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_NO_CATEGORIES_SELECTED);
		}
		const categoryList = categories.map((c) => `- ${c.name}`).join('\n');
		return {
			message: `${MESSAGES.TELEGRAM_VIEW_CATEGORIES_PREFIX}\n${categoryList}`,
			keyboard: this.createInlineKeyboard([]),
			format: 'plain',
		};
	}

	async handleRemoveCategoriesCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const categories = await this.prismaService.client.categoryModel.findMany({
			where: { users: { some: { telegramId: ctx.telegramId } } },
			select: { id: true, name: true },
		});
		if (!categories.length) {
			this.logger.warn(`Нет категорий для удаления для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_NO_CATEGORIES_TO_REMOVE);
		}
		this.telegramUtils.resetSessionFlags(ctx, {
			awaitingRemoveCategories: true,
			categoryIdsToRemove: [],
		});
		return {
			message: MESSAGES.TELEGRAM_SELECT_CATEGORIES_PROMPT,
			keyboard: this.createInlineKeyboard(
				categories,
				(category) => category.name,
				(category) => `${TELEGRAM_ACTIONS.REMOVE_CATEGORY}_${category.id}`,
				[
					{
						text: TELEGRAM_BUTTONS.FINISH_REMOVE_CATEGORIES,
						callback: TELEGRAM_ACTIONS.FINISH_REMOVE_CATEGORIES,
					},
				],
			),
			format: 'plain',
		};
	}

	async handlePromotionsCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const pagination: PaginationDto = {
			page: ctx.session.promotionPage || DEFAULT_PAGINATION.page,
			limit: DEFAULT_PAGINATION.limit,
		};
		ctx.session.promotionPage = pagination.page;
		return this.renderPromotions(ctx, pagination);
	}

	async handlePromotionPageNavigation(
		ctx: ExtendedContext,
		callbackData: string,
	): Promise<TelegramBotResponse> {
		const { page } = this.telegramUtils.parseCallbackData(callbackData);
		if (!page) {
			this.logger.warn(`Недействительная страница для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_INVALID_PAGE, true);
		}
		ctx.session.promotionPage = page;
		return this.renderPromotions(ctx, { page, limit: DEFAULT_PAGINATION.limit });
	}

	async handleHelpCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		return {
			message: MESSAGES.TELEGRAM_HELP,
			keyboard: this.createMainMenu(),
			format: 'plain',
		};
	}

	async handleCommandsCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		return {
			message: MESSAGES.TELEGRAM_COMMANDS_LIST,
			keyboard: this.createMainMenu(),
			format: 'plain',
		};
	}

	async handleCitySelection(ctx: ExtendedContext, cityId: number): Promise<TelegramBotResponse> {
		this.telegramUtils.validateId(cityId, 'CITY');
		await this.prismaService.validateCity(cityId);
		const dto: UserUpdateProfileDto = { cityId };
		const currentUser = { id: ctx.user.id, role: ctx.user.role as Role };
		await this.usersService.updateUserProfile(ctx.user.id, dto, currentUser);
		this.telegramUtils.resetSessionFlags(ctx, { awaitingCategories: true });
		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(
				`Город установлен для пользователя ${ctx.telegramId}, awaitingCity установлено в false, awaitingCategories в true`,
			);
		}
		const existingCategories = await this.prismaService.client.categoryModel.findMany({
			where: { users: { some: { telegramId: ctx.telegramId } } },
			select: { id: true },
		});
		return existingCategories.length
			? this.handlePromotionsCommand(ctx)
			: this.handleSetCategoriesCommand(ctx);
	}

	async handleCategorySelection(
		ctx: ExtendedContext,
		categoryId: number,
	): Promise<TelegramBotResponse | null> {
		this.telegramUtils.validateId(categoryId, 'CATEGORY');
		const category = ctx.session.categoriesCache?.find((c) => c.id === categoryId);
		if (!category) {
			this.logger.warn(
				`Недействительный ID категории ${categoryId} для пользователя ${ctx.telegramId}`,
			);
			return this.createErrorResponse(MESSAGES.CATEGORY_ID_INVALID, true);
		}
		ctx.session.selectedCategoryIds = ctx.session.selectedCategoryIds || [];
		if (ctx.session.selectedCategoryIds.includes(categoryId)) {
			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(`Категория ${categoryId} уже выбрана для пользователя ${ctx.telegramId}`);
			}
			await ctx.answerCbQuery(
				MESSAGES.TELEGRAM_CATEGORY_ALREADY_SELECTED.replace('{{categoryName}}', category.name),
			);
			return null;
		}
		ctx.session.selectedCategoryIds.push(categoryId);
		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(`Категория ${categoryId} добавлена для пользователя ${ctx.telegramId}`);
		}
		return {
			message: MESSAGES.TELEGRAM_SELECT_CATEGORIES_PROMPT,
			keyboard: this.createInlineKeyboard(
				ctx.session.categoriesCache || [],
				(category) =>
					ctx.session.selectedCategoryIds?.includes(category.id)
						? `✅ ${category.name}`
						: category.name,
				(category) => `${TELEGRAM_ACTIONS.SELECT_CATEGORY}_${category.id}`,
				[
					{
						text: TELEGRAM_BUTTONS.FINISH_CATEGORIES,
						callback: TELEGRAM_ACTIONS.FINISH_CATEGORIES,
					},
				],
			),
			format: 'plain',
			editMessage: true,
		};
	}

	async handleRemoveCategorySelection(
		ctx: ExtendedContext,
		categoryId: number,
	): Promise<TelegramBotResponse | null> {
		this.telegramUtils.validateId(categoryId, 'CATEGORY');
		const category = await this.prismaService.client.categoryModel.findUnique({
			where: { id: categoryId },
			select: { name: true },
		});
		if (!category) {
			this.logger.warn(
				`Недействительный ID категории ${categoryId} для пользователя ${ctx.telegramId}`,
			);
			return this.createErrorResponse(MESSAGES.CATEGORY_ID_INVALID, true);
		}
		ctx.session.categoryIdsToRemove = ctx.session.categoryIdsToRemove || [];
		if (ctx.session.categoryIdsToRemove.includes(categoryId)) {
			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(
					`Категория ${categoryId} уже отмечена для удаления для пользователя ${ctx.telegramId}`,
				);
			}
			await ctx.answerCbQuery(
				MESSAGES.TELEGRAM_CATEGORY_ALREADY_MARKED_FOR_REMOVAL.replace(
					'{{categoryName}}',
					category.name,
				),
			);
			return null;
		}
		ctx.session.categoryIdsToRemove.push(categoryId);
		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(
				`Категория ${categoryId} отмечена для удаления для пользователя ${ctx.telegramId}`,
			);
		}
		const categories = await this.prismaService.client.categoryModel.findMany({
			where: { users: { some: { telegramId: ctx.telegramId } } },
			select: { id: true, name: true },
		});
		if (!categories.length) {
			this.telegramUtils.resetSessionFlags(ctx);
			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(`Нет категорий для удаления для пользователя ${ctx.telegramId}`);
			}
			await ctx.answerCbQuery(MESSAGES.TELEGRAM_CATEGORIES_REMOVED);
			return this.createErrorResponse(MESSAGES.TELEGRAM_CATEGORIES_REMOVED, true);
		}
		return {
			message: MESSAGES.TELEGRAM_SELECT_CATEGORIES_PROMPT,
			keyboard: this.createInlineKeyboard(
				categories,
				(category) =>
					ctx.session.categoryIdsToRemove?.includes(category.id)
						? `✅ ${category.name}`
						: category.name,
				(category) => `${TELEGRAM_ACTIONS.REMOVE_CATEGORY}_${category.id}`,
				[
					{
						text: TELEGRAM_BUTTONS.FINISH_REMOVE_CATEGORIES,
						callback: TELEGRAM_ACTIONS.FINISH_REMOVE_CATEGORIES,
					},
				],
			),
			format: 'plain',
			editMessage: true,
		};
	}

	async handleFinishCategories(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const selectedCategoryIds = ctx.session.selectedCategoryIds || [];
		if (selectedCategoryIds.length) {
			await this.prismaService.validateCategories(selectedCategoryIds);
			const dto: UserUpdateProfileDto = { categoryIds: selectedCategoryIds };
			const currentUser = { id: ctx.user.id, role: ctx.user.role as Role };
			await this.usersService.updateUserProfile(ctx.user.id, dto, currentUser);
			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(
					`Категории обновлены для пользователя ${ctx.telegramId}: ${selectedCategoryIds}`,
				);
			}
		}
		this.telegramUtils.resetSessionFlags(ctx);
		return this.handlePromotionsCommand(ctx);
	}

	async handleFinishRemoveCategories(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const categoryIdsToRemove = ctx.session.categoryIdsToRemove || [];
		if (categoryIdsToRemove.length) {
			await this.prismaService.validateCategories(categoryIdsToRemove);
			const dto: UserUpdateProfileDto = {
				categoryIds: (
					await this.prismaService.client.categoryModel.findMany({
						where: { users: { some: { telegramId: ctx.telegramId } } },
						select: { id: true },
					})
				)
					.map((c) => c.id)
					.filter((id) => !categoryIdsToRemove.includes(id)),
			};
			const currentUser = { id: ctx.user.id, role: ctx.user.role as Role };
			await this.usersService.updateUserProfile(ctx.user.id, dto, currentUser);
			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(
					`Категории удалены для пользователя ${ctx.telegramId}: ${categoryIdsToRemove}`,
				);
			}
		}
		this.telegramUtils.resetSessionFlags(ctx);
		return this.createErrorResponse(MESSAGES.TELEGRAM_CATEGORIES_REMOVED);
	}

	private async renderPromotions(
		ctx: ExtendedContext,
		pagination: PaginationDto,
	): Promise<TelegramBotResponse> {
		if (!ctx.user) {
			this.logger.warn(`Пользователь не найден для telegramId ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_USER_NOT_FOUND);
		}

		if (!ctx.user.cityId) {
			this.logger.warn(`Город не выбран для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_NO_CITY_SELECTED);
		}

		const userCategories = await this.prismaService.client.categoryModel.findMany({
			where: { users: { some: { telegramId: ctx.telegramId } } },
			select: { id: true },
		});
		if (!userCategories.length) {
			this.logger.warn(`Нет выбранных категорий для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(
				'Категории не выбраны. Используйте /setcategories для выбора.',
			);
		}

		const promotions = await this.promotionsService.getPromotionsForUser(
			ctx.telegramId,
			pagination,
		);
		if (!promotions.items.length) {
			this.logger.warn(`Акции не найдены для пользователя ${ctx.telegramId}`);
			return {
				message: MESSAGES.TELEGRAM_NO_PROMOTIONS,
				keyboard: this.createCancelOnlyKeyboard(),
				format: 'plain',
				editMessage: pagination.page !== 1,
			};
		}

		const promotionList = promotions.items
			.map(
				(p: PromotionWithRelations) =>
					`*${p.title.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')}*\n` +
					`${p.description?.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1') ?? ''}\n` +
					`С ${p.startDate.toLocaleDateString('ru-RU')} по ${p.endDate.toLocaleDateString('ru-RU')}`,
			)
			.join('\n\n');

		const keyboard = this.createInlineKeyboard(
			[],
			() => '',
			() => '',
			[],
			{
				page: pagination.page,
				totalPages: promotions.meta.totalPages,
				actionPrefix: TELEGRAM_ACTIONS.PREV_PROMOTION_PAGE,
			},
		);

		return {
			message: `Акции для ваших категорий:\n\n${promotionList}\n\nСтраница ${promotions.meta.page} из ${promotions.meta.totalPages}`,
			keyboard,
			format: 'markdown',
			editMessage: pagination.page !== 1,
		};
	}

	private createInlineKeyboard<T>(
		items: T[] = [],
		getText: (item: T) => string = () => '',
		getCallback: (item: T) => string = () => '',
		extraButtons: { text: string; callback: string }[] = [],
		pagination?: { page: number; totalPages: number; actionPrefix: string },
	) {
		const buttons = items.map((item) => [Markup.button.callback(getText(item), getCallback(item))]);
		const extra = extraButtons.map((btn) => [Markup.button.callback(btn.text, btn.callback)]);
		extra.push([Markup.button.callback(TELEGRAM_BUTTONS.CANCEL, TELEGRAM_ACTIONS.CANCEL_ACTION)]);
		if (pagination) {
			const { page, totalPages, actionPrefix } = pagination;
			if (page > 1) {
				extra.unshift([
					Markup.button.callback(TELEGRAM_BUTTONS.PREV_PAGE, `${actionPrefix}_${page - 1}`),
				]);
			}
			if (page < totalPages) {
				extra.push([
					Markup.button.callback(TELEGRAM_BUTTONS.NEXT_PAGE, `${actionPrefix}_${page + 1}`),
				]);
			}
		}
		return { inline_keyboard: [...buttons, ...extra] };
	}

	public createMainMenu() {
		return {
			keyboard: [
				['/setcity', '/setcategories'],
				['/viewcity', '/viewcategories'],
				['/removecategories', '/promotions'],
				['/help'],
			],
			resize_keyboard: true,
		};
	}
}
