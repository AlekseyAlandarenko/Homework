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

type IdType = 'CITY' | 'CATEGORY' | 'PRODUCT' | 'ADDRESS';

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
		};
	}

	resetSessionFlags(ctx: ExtendedContext, flags: Partial<ExtendedContext['session']> = {}): void {
		ctx.session.awaitingCity = false;
		ctx.session.awaitingCategories = false;
		ctx.session.awaitingRemoveCategories = false;
		ctx.session.awaitingAddressInput = false;
		Object.assign(ctx.session, flags);
	}

	parseCallbackData(data: string): CallbackData {
		const parts = data.split('_');
		let action: string;
		let param: string | undefined;

		if (
			data === TELEGRAM_ACTIONS.CANCEL_ACTION ||
			data === TELEGRAM_ACTIONS.FINISH_CATEGORIES ||
			data === TELEGRAM_ACTIONS.FINISH_REMOVE_CATEGORIES ||
			data === TELEGRAM_ACTIONS.AWAITING_ADDRESS_INPUT ||
			data === TELEGRAM_ACTIONS.FINISH_ADD_TO_CART
		) {
			action = data;
		} else if (data.startsWith(TELEGRAM_ACTIONS.SELECT_CITY)) {
			action = TELEGRAM_ACTIONS.SELECT_CITY;
			param = parts[2];
		} else if (data.startsWith(TELEGRAM_ACTIONS.SELECT_CATEGORY)) {
			action = TELEGRAM_ACTIONS.SELECT_CATEGORY;
			param = parts[2];
		} else if (data.startsWith(TELEGRAM_ACTIONS.REMOVE_CATEGORY)) {
			action = TELEGRAM_ACTIONS.REMOVE_CATEGORY;
			param = parts[2];
		} else if (data.startsWith(TELEGRAM_ACTIONS.PREV_PAGE)) {
			action = TELEGRAM_ACTIONS.PREV_PAGE;
			param = parts[2];
		} else if (data.startsWith(TELEGRAM_ACTIONS.NEXT_PAGE)) {
			action = TELEGRAM_ACTIONS.NEXT_PAGE;
			param = parts[2];
		} else if (data.startsWith(TELEGRAM_ACTIONS.PREV_PRODUCT_PAGE)) {
			action = TELEGRAM_ACTIONS.PREV_PRODUCT_PAGE;
			param = parts[3];
		} else if (data.startsWith(TELEGRAM_ACTIONS.NEXT_PRODUCT_PAGE)) {
			action = TELEGRAM_ACTIONS.NEXT_PRODUCT_PAGE;
			param = parts[3];
		} else if (data.startsWith(TELEGRAM_ACTIONS.ADD_TO_CART)) {
			action = TELEGRAM_ACTIONS.ADD_TO_CART;
			param = parts[3];
		} else if (data.startsWith(TELEGRAM_ACTIONS.SELECT_ADDRESS)) {
			action = TELEGRAM_ACTIONS.SELECT_ADDRESS;
			param = parts[2];
		} else {
			this.logger.error(`Недействительное действие callback: ${data}`);
			throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_ACTION);
		}

		if (!Object.values(TELEGRAM_ACTIONS).includes(action as CallbackAction)) {
			this.logger.error(`Недействительное действие callback: ${action}`);
			throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_ACTION);
		}

		const result: CallbackData = { action: action as CallbackAction };
		if (param) {
			const num = Number(param);
			if (!isNaN(num) && num > 0) {
				result[action.includes('page') ? 'page' : 'id'] = num;
			} else {
				this.logger.warn(`Недопустимый параметр в callback: ${param}`);
				throw new HTTPError(400, MESSAGES.TELEGRAM_INVALID_PARAM);
			}
		}

		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(`Разобранные данные callback: ${JSON.stringify(result)}`);
		}

		return result;
	}
}
