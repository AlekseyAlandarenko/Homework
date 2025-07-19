import { injectable, inject } from 'inversify';
import { ExtendedContext } from './telegram-bot.controller';
import { TelegramBotResponse } from './telegram-bot.service.interface';
import { ITelegramBotService } from './telegram-bot.service.interface';
import { TelegramUtils } from './telegram.utils';
import { TELEGRAM_ACTIONS, TELEGRAM_BUTTONS } from './telegram.constants';
import { MESSAGES } from '../common/messages';
import { TYPES } from '../types';
import { HTTPError } from '../errors/http-error.class';
import { ILogger } from '../logger/logger.interface';
import { Markup } from 'telegraf';

@injectable()
export class CallbackHandler {
	constructor(
		@inject(TYPES.TelegramBotService) private telegramService: ITelegramBotService,
		@inject(TYPES.TelegramUtils) private telegramUtils: TelegramUtils,
		@inject(TYPES.ILogger) private logger: ILogger,
	) {}

	async handle(ctx: ExtendedContext, callbackData: string): Promise<TelegramBotResponse | null> {
		try {
			const { action, id, page, optionId } = this.telegramUtils.parseCallbackData(callbackData);
			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(
					`Разобранное действие: ${action}, id: ${id}, page: ${page}, optionId: ${optionId}`,
				);
			}

			switch (action) {
				case TELEGRAM_ACTIONS.PREV_PRODUCT_PAGE:
				case TELEGRAM_ACTIONS.NEXT_PRODUCT_PAGE:
					if (!page) {
						this.logger.warn(`Недействительная страница для действия ${action}`);
						return this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_PAGE, true);
					}
					return this.telegramService.handleProductPageNavigation(ctx, `${action}_${page}`);
				case TELEGRAM_ACTIONS.SEARCH_PRODUCTS:
					ctx.session.awaitingSearchInput = true;
					return {
						message: MESSAGES.TELEGRAM_ENTER_SEARCH_QUERY,
						keyboard: {
							inline_keyboard: [
								[Markup.button.callback(TELEGRAM_BUTTONS.CANCEL, TELEGRAM_ACTIONS.CANCEL_ACTION)],
							],
						},
						format: 'plain',
						editMessage: true,
					};
				case TELEGRAM_ACTIONS.SELECT_CITY:
					if (!id) {
						this.logger.warn(`Недействительный ID города для действия ${action}`);
						return this.telegramService.createErrorResponse(MESSAGES.CITY_ID_INVALID, true);
					}
					if (!ctx.session.awaitingCity) {
						this.logger.warn(`Недействительное действие: не ожидается выбор города для ${action}`);
						return this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_ACTION, true);
					}
					return this.telegramService.handleCitySelection(ctx, id);
				case TELEGRAM_ACTIONS.SELECT_CATEGORY:
					if (!id) {
						this.logger.warn(`Недействительный ID категории для действия ${action}`);
						return this.telegramService.createErrorResponse(MESSAGES.CATEGORY_ID_INVALID, true);
					}
					if (!ctx.session.awaitingCategories) {
						this.logger.warn(
							`Недействительное действие: не ожидается выбор категорий для ${action}`,
						);
						return this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_ACTION, true);
					}
					return this.telegramService.handleCategorySelection(ctx, id);
				case TELEGRAM_ACTIONS.REMOVE_CATEGORY:
					if (!id) {
						this.logger.warn(`Недействительный ID категории для действия ${action}`);
						return this.telegramService.createErrorResponse(MESSAGES.CATEGORY_ID_INVALID, true);
					}
					if (!ctx.session.awaitingRemoveCategories) {
						this.logger.warn(
							`Недействительное действие: не ожидается удаление категорий для ${action}`,
						);
						return this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_ACTION, true);
					}
					return this.telegramService.handleRemoveCategorySelection(ctx, id);
				case TELEGRAM_ACTIONS.FINISH_CATEGORIES:
					if (!ctx.session.awaitingCategories) {
						this.logger.warn(
							`Недействительное действие: не ожидается завершение категорий для ${action}`,
						);
						return this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_ACTION, true);
					}
					return this.telegramService.handleFinishCategories(ctx);
				case TELEGRAM_ACTIONS.FINISH_REMOVE_CATEGORIES:
					if (!ctx.session.awaitingRemoveCategories) {
						this.logger.warn(
							`Недействительное действие: не ожидается завершение удаления категорий для ${action}`,
						);
						return this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_ACTION, true);
					}
					return this.telegramService.handleFinishRemoveCategories(ctx);
				case TELEGRAM_ACTIONS.ADD_TO_CART:
					if (!id) {
						this.logger.warn(`Недействительный ID товара для действия ${action}`);
						return this.telegramService.createErrorResponse(
							MESSAGES.TELEGRAM_INVALID_PRODUCT,
							true,
						);
					}
					return this.telegramService.handleAddToCart(ctx, id);
				case TELEGRAM_ACTIONS.SELECT_ADDRESS:
					if (!id) {
						this.logger.warn(`Недействительный ID адреса для действия ${action}`);
						return this.telegramService.createErrorResponse(MESSAGES.ADDRESSES_NOT_FOUND, true);
					}
					return this.telegramService.handleAddressSelection(ctx, id);
				case TELEGRAM_ACTIONS.AWAITING_ADDRESS_INPUT:
					ctx.session.awaitingAddressInput = true;
					return {
						message: MESSAGES.TELEGRAM_ENTER_ADDRESS_PROMPT,
						keyboard: {
							inline_keyboard: [
								[Markup.button.callback(TELEGRAM_BUTTONS.CANCEL, TELEGRAM_ACTIONS.CANCEL_ACTION)],
							],
						},
						format: 'plain',
						editMessage: true,
					};
				case TELEGRAM_ACTIONS.FINISH_ADD_TO_CART:
					this.telegramUtils.resetSession(ctx);
					if (process.env.DEBUG_LOGGING === 'true') {
						this.logger.log(`Завершение добавления в корзину для пользователя ${ctx.from?.id}`);
					}
					return this.telegramService.handleCartCommand(ctx);
				case TELEGRAM_ACTIONS.REMOVE_FROM_CART:
					if (!id) {
						this.logger.warn(`Недействительный ID товара для действия ${action}`);
						return this.telegramService.createErrorResponse(
							MESSAGES.TELEGRAM_INVALID_PRODUCT,
							true,
						);
					}
					return this.telegramService.handleRemoveFromCart(ctx, id, optionId);
				case TELEGRAM_ACTIONS.SELECT_OPTION:
					if (!id || !optionId) {
						this.logger.warn(`Недействительные ID товара или опции для действия ${action}`);
						return this.telegramService.createErrorResponse(
							MESSAGES.TELEGRAM_INVALID_PRODUCT,
							true,
						);
					}
					return this.telegramService.handleOptionSelection(ctx, id, optionId);
				case TELEGRAM_ACTIONS.CONFIRM_CHECKOUT:
					return this.telegramService.handleConfirmCheckout(ctx);
				case TELEGRAM_ACTIONS.CANCEL_ACTION:
					this.telegramUtils.resetSession(ctx);
					if (process.env.DEBUG_LOGGING === 'true') {
						this.logger.log(`Действие отменено для пользователя ${ctx.from?.id}`);
					}
					return {
						message: MESSAGES.TELEGRAM_COMMANDS_LIST,
						keyboard: this.telegramService.createMainMenu(),
						format: 'plain',
						editMessage: true,
					};
				case TELEGRAM_ACTIONS.PREV_PAGE:
				case TELEGRAM_ACTIONS.NEXT_PAGE:
					if (!page) {
						this.logger.warn(`Недействительная страница для действия ${action}`);
						return this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_PAGE, true);
					}
					ctx.session.page = page;
					return this.telegramService.handleSetCategoriesCommand(ctx);
				default:
					this.logger.warn(`Неизвестное действие: ${action}`);
					return this.telegramService.createErrorResponse(MESSAGES.TELEGRAM_INVALID_ACTION, true);
			}
		} catch (error: unknown) {
			const err = error instanceof Error ? error : new Error(String(error));
			const message = err instanceof HTTPError ? err.message : MESSAGES.TELEGRAM_INVALID_ACTION;
			this.logger.error(`Ошибка обработки callback: ${err.message}, стек: ${err.stack}`);
			return this.telegramService.createErrorResponse(message, true);
		}
	}
}
