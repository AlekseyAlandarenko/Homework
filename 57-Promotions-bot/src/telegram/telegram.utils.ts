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
}

type IdType = 'CITY' | 'CATEGORY';

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
		};
	}

	resetSessionFlags(ctx: ExtendedContext, flags: Partial<ExtendedContext['session']> = {}): void {
		ctx.session.awaitingCity = false;
		ctx.session.awaitingCategories = false;
		ctx.session.awaitingRemoveCategories = false;
		Object.assign(ctx.session, flags);
	}

	parseCallbackData(data: string): CallbackData {
		const actions: { [key: string]: { action: CallbackAction; paramIndex?: number } } = {
			[TELEGRAM_ACTIONS.CANCEL_ACTION]: { action: TELEGRAM_ACTIONS.CANCEL_ACTION },
			[TELEGRAM_ACTIONS.FINISH_CATEGORIES]: { action: TELEGRAM_ACTIONS.FINISH_CATEGORIES },
			[TELEGRAM_ACTIONS.FINISH_REMOVE_CATEGORIES]: {
				action: TELEGRAM_ACTIONS.FINISH_REMOVE_CATEGORIES,
			},
			[TELEGRAM_ACTIONS.SELECT_CITY]: { action: TELEGRAM_ACTIONS.SELECT_CITY, paramIndex: 2 },
			[TELEGRAM_ACTIONS.SELECT_CATEGORY]: {
				action: TELEGRAM_ACTIONS.SELECT_CATEGORY,
				paramIndex: 2,
			},
			[TELEGRAM_ACTIONS.REMOVE_CATEGORY]: {
				action: TELEGRAM_ACTIONS.REMOVE_CATEGORY,
				paramIndex: 2,
			},
			[TELEGRAM_ACTIONS.PREV_PAGE]: { action: TELEGRAM_ACTIONS.PREV_PAGE, paramIndex: 2 },
			[TELEGRAM_ACTIONS.NEXT_PAGE]: { action: TELEGRAM_ACTIONS.NEXT_PAGE, paramIndex: 2 },
			[TELEGRAM_ACTIONS.PREV_PROMOTION_PAGE]: {
				action: TELEGRAM_ACTIONS.PREV_PROMOTION_PAGE,
				paramIndex: 3,
			},
			[TELEGRAM_ACTIONS.NEXT_PROMOTION_PAGE]: {
				action: TELEGRAM_ACTIONS.NEXT_PROMOTION_PAGE,
				paramIndex: 3,
			},
		};

		const parts = data.split('_');
		const match = Object.keys(actions).find((key) => data.startsWith(key));
		if (!match) {
			this.logger.error(`Недействительное действие callback: ${data}`);
			throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_ACTION);
		}

		const action = actions[match].action;
		const param = actions[match].paramIndex ? parts[actions[match].paramIndex] : undefined;

		const result: CallbackData = { action };
		if (param) {
			const num = Number(param);
			if (isNaN(num) || num <= 0) {
				this.logger.warn(`Недопустимый параметр в callback: ${param}`);
				throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_PARAM);
			}
			result[action.includes('page') ? 'page' : 'id'] = num;
		}

		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(`Разобранные данные callback: ${JSON.stringify(result)}`);
		}

		return result;
	}
}
