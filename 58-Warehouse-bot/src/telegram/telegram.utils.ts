import { HTTPError } from '../errors/http-error.class';
import { MESSAGES } from '../common/messages';
import { CallbackAction, TELEGRAM_ACTIONS } from './telegram.constants';
import { ILogger } from '../logger/logger.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ExtendedContext } from './telegram-bot.controller';

export interface CallbackData {
	action: CallbackAction;
	id?: number;
	page?: number;
	optionId?: number;
}

type IdType = 'CITY' | 'CATEGORY' | 'PRODUCT' | 'ADDRESS' | 'OPTION';

@injectable()
export class TelegramUtils {
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {}

	getTelegramId(ctx: ExtendedContext): string {
		const telegramId = ctx.from?.id.toString();
		if (!telegramId) {
			this.logger.error('telegramId не найден в контексте');
			throw new HTTPError(400, MESSAGES.TELEGRAM_ID_REQUIRED_FIELD);
		}
		return telegramId;
	}

	validateId(id: number, type: IdType): void {
		if (!id || isNaN(id) || id <= 0) {
			this.logger.warn(`Недействительный ID ${type}: ${id}`);
			throw new HTTPError(400, MESSAGES[`${type}_ID_INVALID`]);
		}
	}

	resetSession(ctx: ExtendedContext): void {
		ctx.session = {
			page: 1,
			promotionPage: 1,
			awaitingCity: false,
			awaitingCategories: false,
			awaitingRemoveCategories: false,
			selectedCategoryIds: [],
			categoryIdsToRemove: [],
			categoriesCache: [],
			awaitingAddressInput: false,
			selectedAddress: '',
			awaitingSearchInput: false,
			searchQuery: '',
			awaitingOptionSelection: false,
			selectedProductId: undefined,
		};
	}

	resetSessionFlags(ctx: ExtendedContext, flags: Partial<ExtendedContext['session']> = {}): void {
		ctx.session.awaitingCity = false;
		ctx.session.awaitingCategories = false;
		ctx.session.awaitingRemoveCategories = false;
		ctx.session.awaitingAddressInput = false;
		ctx.session.awaitingSearchInput = false;
		ctx.session.awaitingOptionSelection = false;
		Object.assign(ctx.session, flags);
	}

	parseCallbackData(data: string): CallbackData {
		const parts = data.split('_');

		const actions: {
			[key: string]: { action: CallbackAction; idIndex?: number; optionIdIndex?: number };
		} = {
			[TELEGRAM_ACTIONS.CANCEL_ACTION]: { action: TELEGRAM_ACTIONS.CANCEL_ACTION },
			[TELEGRAM_ACTIONS.FINISH_CATEGORIES]: { action: TELEGRAM_ACTIONS.FINISH_CATEGORIES },
			[TELEGRAM_ACTIONS.FINISH_REMOVE_CATEGORIES]: {
				action: TELEGRAM_ACTIONS.FINISH_REMOVE_CATEGORIES,
			},
			[TELEGRAM_ACTIONS.AWAITING_ADDRESS_INPUT]: {
				action: TELEGRAM_ACTIONS.AWAITING_ADDRESS_INPUT,
			},
			[TELEGRAM_ACTIONS.FINISH_ADD_TO_CART]: { action: TELEGRAM_ACTIONS.FINISH_ADD_TO_CART },
			[TELEGRAM_ACTIONS.SEARCH_PRODUCTS]: { action: TELEGRAM_ACTIONS.SEARCH_PRODUCTS },
			[TELEGRAM_ACTIONS.CONFIRM_CHECKOUT]: { action: TELEGRAM_ACTIONS.CONFIRM_CHECKOUT },
			[TELEGRAM_ACTIONS.SELECT_CITY]: { action: TELEGRAM_ACTIONS.SELECT_CITY, idIndex: 2 },
			[TELEGRAM_ACTIONS.SELECT_CATEGORY]: { action: TELEGRAM_ACTIONS.SELECT_CATEGORY, idIndex: 2 },
			[TELEGRAM_ACTIONS.REMOVE_CATEGORY]: { action: TELEGRAM_ACTIONS.REMOVE_CATEGORY, idIndex: 2 },
			[TELEGRAM_ACTIONS.PREV_PAGE]: { action: TELEGRAM_ACTIONS.PREV_PAGE, idIndex: 2 },
			[TELEGRAM_ACTIONS.NEXT_PAGE]: { action: TELEGRAM_ACTIONS.NEXT_PAGE, idIndex: 2 },
			[TELEGRAM_ACTIONS.PREV_PRODUCT_PAGE]: {
				action: TELEGRAM_ACTIONS.PREV_PRODUCT_PAGE,
				idIndex: 3,
			},
			[TELEGRAM_ACTIONS.NEXT_PRODUCT_PAGE]: {
				action: TELEGRAM_ACTIONS.NEXT_PRODUCT_PAGE,
				idIndex: 3,
			},
			[TELEGRAM_ACTIONS.ADD_TO_CART]: { action: TELEGRAM_ACTIONS.ADD_TO_CART, idIndex: 3 },
			[TELEGRAM_ACTIONS.SELECT_ADDRESS]: { action: TELEGRAM_ACTIONS.SELECT_ADDRESS, idIndex: 2 },
			[TELEGRAM_ACTIONS.REMOVE_FROM_CART]: {
				action: TELEGRAM_ACTIONS.REMOVE_FROM_CART,
				idIndex: 3,
				optionIdIndex: 4,
			},
			[TELEGRAM_ACTIONS.SELECT_OPTION]: {
				action: TELEGRAM_ACTIONS.SELECT_OPTION,
				idIndex: 2,
				optionIdIndex: 3,
			},
		};

		const match = Object.keys(actions).find((key) => data === key || data.startsWith(key + '_'));
		if (!match) {
			this.logger.error(`Недействительное действие callback: ${data}`);
			throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_ACTION);
		}

		const { action, idIndex, optionIdIndex } = actions[match];
		const result: CallbackData = { action };

		if (idIndex !== undefined) {
			const param = parts[idIndex];
			if (!param) {
				this.logger.warn(`Отсутствует параметр для действия ${action}`);
				throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_PARAM);
			}
			const num = Number(param);
			if (isNaN(num) || num <= 0) {
				this.logger.warn(`Недопустимый параметр в callback: ${param}`);
				throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_PARAM);
			}
			result[action.includes('page') ? 'page' : 'id'] = num;
		}

		if (optionIdIndex !== undefined) {
			const optionParam = parts[optionIdIndex];
			if (optionParam) {
				const num = Number(optionParam);
				if (isNaN(num) || num <= 0) {
					this.logger.warn(`Недопустимый optionId в callback: ${optionParam}`);
					throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_PARAM);
				}
				result.optionId = num;
			}
		}

		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(`Разобранные данные callback: ${JSON.stringify(result)}`);
		}

		return result;
	}
}
