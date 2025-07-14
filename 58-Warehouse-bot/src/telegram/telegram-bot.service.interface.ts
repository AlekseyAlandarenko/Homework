import { ExtendedContext } from './telegram-bot.controller';

export interface TelegramBotResponse {
	message: string;
	keyboard?: any;
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
	handleProductsCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleProductPageNavigation(
		ctx: ExtendedContext,
		callbackData: string,
	): Promise<TelegramBotResponse>;
	handleHelpCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleCommandsCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleSetAddressCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleAddressInput(ctx: ExtendedContext, address: string): Promise<TelegramBotResponse>;
	handleAddressSelection(ctx: ExtendedContext, addressId: number): Promise<TelegramBotResponse>;
	handleViewAddressCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleCartCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleCheckoutCommand(ctx: ExtendedContext): Promise<TelegramBotResponse>;
	handleAddToCart(ctx: ExtendedContext, productId: number): Promise<TelegramBotResponse | null>;
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
	createMainMenu(): any;
	createErrorResponse(message: string, editMessage?: boolean): TelegramBotResponse;
}
