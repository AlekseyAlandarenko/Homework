import { InlineKeyboardMarkup, ReplyKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { ExtendedContext } from './telegram-bot.controller';

export interface TelegramBotResponse {
	message: string;
	keyboard?: ReplyKeyboardMarkup | InlineKeyboardMarkup;
	format: 'plain' | 'markdown';
	editMessage?: boolean;
}

export interface ITelegramBotService {
	handleStartCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleSetCityCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleViewCityCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleSetCategoriesCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleViewCategoriesCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleRemoveCategoriesCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handlePromotionsCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleDisableNotificationsCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handlePromotionPageNavigation(
		ctx: ExtendedContext,
		callbackData: string,
	): Promise<TelegramBotResponse>;
	handleHelpCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleCommandsCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleCitySelection(ctx: ExtendedContext, cityId: number): Promise<TelegramBotResponse>;
	handleCategorySelection(
		ctx: ExtendedContext,
		categoryId: number,
	): Promise<TelegramBotResponse | null>;
	handleRemoveCategorySelection(
		ctx: ExtendedContext,
		categoryId: number,
	): Promise<TelegramBotResponse | null>;
	handleFinishCategories(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleFinishRemoveCategories(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	createMainMenu(): ReplyKeyboardMarkup;
	createErrorResponse(message: string, editMessage?: boolean): TelegramBotResponse;
}
