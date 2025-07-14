import { injectable, inject } from 'inversify';
import { ExtendedContext } from './telegram-bot.controller';
import { TelegramBotResponse } from './telegram-bot.service.interface';
import { ITelegramBotService } from './telegram-bot.service.interface';
import { IUsersService } from '../users/users.service.interface';
import { IProductsService } from '../products/products.service.interface';
import { ICartService } from '../cart/cart.service.interface';
import { TYPES } from '../types';
import { MESSAGES } from '../common/messages';
import { Markup } from 'telegraf';
import { PrismaService } from '../database/prisma.service';
import { UserUpdateProfileDto } from '../users/dto/user-update-profile.dto';
import { Role } from '../common/enums/role.enum';
import { TELEGRAM_ACTIONS, TELEGRAM_BUTTONS } from './telegram.constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProductWithRelations } from '../products/products.repository.interface';
import { DEFAULT_PAGINATION } from '../common/constants';
import { ILogger } from '../logger/logger.interface';
import { TelegramUtils } from './telegram.utils';
import { CartResponse } from '../cart/dto/cart-response.dto';

@injectable()
export class TelegramBotService implements ITelegramBotService {
	constructor(
		@inject(TYPES.UsersService) private readonly usersService: IUsersService,
		@inject(TYPES.ProductsService) private readonly productsService: IProductsService,
		@inject(TYPES.CartService) private readonly cartService: ICartService,
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
			keyboard: this.createCancelOnlyKeyboard(),
			format: 'plain',
		};
	}

	async handleSetCategoriesCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const page = ctx.session.page || 1;
		const limit = 1023;
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
			return this.handleProductsCommand(ctx);
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
			keyboard: this.createCancelOnlyKeyboard(),
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

	async handleProductsCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
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
			return this.handleSetCategoriesCommand(ctx);
		}

		const pagination: PaginationDto = {
			page: ctx.session.promotionPage || DEFAULT_PAGINATION.page,
			limit: DEFAULT_PAGINATION.limit,
		};
		ctx.session.promotionPage = pagination.page;
		return this.renderProducts(ctx, pagination);
	}

	async handleProductPageNavigation(
		ctx: ExtendedContext,
		callbackData: string,
	): Promise<TelegramBotResponse> {
		const { page } = this.telegramUtils.parseCallbackData(callbackData);
		if (!page) {
			this.logger.warn(`Недействительная страница для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_INVALID_PAGE, true);
		}
		ctx.session.promotionPage = page;
		return this.renderProducts(ctx, { page, limit: DEFAULT_PAGINATION.limit });
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

	async handleSetAddressCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const addresses = await this.prismaService.findUserAddresses(ctx.user.id);
		if (addresses.length > 0) {
			return {
				message: MESSAGES.TELEGRAM_SELECT_ADDRESS_PROMPT,
				keyboard: this.createInlineKeyboard(
					addresses,
					(address) => address.address,
					(address) => `${TELEGRAM_ACTIONS.SELECT_ADDRESS}_${address.id}`,
					[
						{
							text: TELEGRAM_BUTTONS.FINISH_ADDRESS,
							callback: TELEGRAM_ACTIONS.AWAITING_ADDRESS_INPUT,
						},
					],
				),
				format: 'plain',
			};
		}

		this.telegramUtils.resetSessionFlags(ctx, { awaitingAddressInput: true });
		return {
			message: MESSAGES.TELEGRAM_ENTER_ADDRESS_PROMPT,
			keyboard: this.createCancelOnlyKeyboard(),
			format: 'plain',
		};
	}

	async handleAddressInput(ctx: ExtendedContext, address: string): Promise<TelegramBotResponse> {
		const addressRegex = /^[а-яА-Яa-zA-Z0-9\s,.-]+$/;
		if (
			!address ||
			address.trim().length === 0 ||
			address.length > 255 ||
			!addressRegex.test(address)
		) {
			this.logger.warn(`Недействительный адрес для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_INVALID_ADDRESS, true);
		}

		ctx.session.selectedAddress = address;
		ctx.session.awaitingAddressInput = false;

		const dto: UserUpdateProfileDto = {
			addresses: [{ address, isDefault: true }],
		};
		const currentUser = { id: ctx.user.id, role: ctx.user.role as Role };
		await this.usersService.updateUserProfile(ctx.user.id, dto, currentUser);

		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(`Адрес сохранен для пользователя ${ctx.telegramId}`);
		}
		return {
			message: MESSAGES.TELEGRAM_ADDRESS_SAVED,
			keyboard: this.createCancelOnlyKeyboard(),
			format: 'plain',
		};
	}

	async handleAddressSelection(
		ctx: ExtendedContext,
		addressId: number,
	): Promise<TelegramBotResponse> {
		this.telegramUtils.validateId(addressId, 'ADDRESS');
		const address = await this.prismaService.findAddressesById([addressId], ctx.user.id);
		if (!address.length) {
			this.logger.warn(`Адрес ${addressId} не найден для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.ADDRESSES_NOT_FOUND, true);
		}

		const dto: UserUpdateProfileDto = {
			addresses: [{ address: address[0].address, isDefault: true }],
		};
		const currentUser = { id: ctx.user.id, role: ctx.user.role as Role };
		await this.usersService.updateUserProfile(ctx.user.id, dto, currentUser);

		ctx.session.awaitingAddressInput = false;
		if (process.env.DEBUG_LOGGING === 'true') {
			this.logger.log(`Адрес установлен для пользователя ${ctx.telegramId}`);
		}
		return {
			message: MESSAGES.TELEGRAM_ADDRESS_SAVED,
			keyboard: this.createCancelOnlyKeyboard(),
			format: 'plain',
			editMessage: true,
		};
	}

	async handleViewAddressCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const addresses = await this.prismaService.findUserAddresses(ctx.user.id);
		const defaultAddress = addresses.find((addr) => addr.isDefault);
		if (!defaultAddress) {
			this.logger.warn(`Адрес не выбран для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_NO_ADDRESS_SELECTED);
		}

		return {
			message: `${MESSAGES.TELEGRAM_VIEW_ADDRESS_PREFIX}\n${defaultAddress.address}`,
			keyboard: this.createCancelOnlyKeyboard(),
			format: 'plain',
		};
	}

	async handleCartCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const cart = await this.cartService.getCartItems(ctx.user.id);
		if (!cart.items.length) {
			this.logger.warn(`Корзина пуста для пользователя ${ctx.telegramId}`);
			return {
				message: MESSAGES.TELEGRAM_NO_ITEMS_IN_CART,
				keyboard: this.createCancelOnlyKeyboard(),
				format: 'plain',
			};
		}

		const cartList = cart.items
			.map((item: CartResponse) => {
				const productName = item.product.name
					? item.product.name.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')
					: 'Товар не найден';
				return `*${productName}* - ${item.quantity} шт.\nЦена: ${item.price.toFixed(2)} руб.`;
			})
			.join('\n\n');
		return {
			message: `Ваша корзина:\n\n${cartList}\n\nИтого: ${cart.total.toFixed(2)} руб.`,
			keyboard: this.createCancelOnlyKeyboard(),
			format: 'markdown',
		};
	}

	async handleCheckoutCommand(ctx: ExtendedContext): Promise<TelegramBotResponse> {
		const addresses = await this.prismaService.findUserAddresses(ctx.user.id);
		const defaultAddress = addresses.find((addr) => addr.isDefault);
		if (!defaultAddress) {
			this.logger.warn(`Адрес не выбран для пользователя ${ctx.telegramId}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_NO_ADDRESS_SELECTED);
		}

		const cart = await this.cartService.getCartItems(ctx.user.id);
		if (!cart.items.length) {
			this.logger.warn(`Корзина пуста для пользователя ${ctx.telegramId}`);
			return {
				message: MESSAGES.TELEGRAM_NO_ITEMS_IN_CART,
				keyboard: this.createCancelOnlyKeyboard(),
				format: 'plain',
			};
		}

		const checkoutDto = {
			items: cart.items.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
			})),
		};

		try {
			await this.cartService.checkoutCartItems(ctx.user.id, checkoutDto);
			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(`Заказ успешно оформлен для пользователя ${ctx.telegramId}`);
			}
			return {
				message: MESSAGES.TELEGRAM_CHECKOUT_SUCCESS,
				keyboard: this.createCancelOnlyKeyboard(),
				format: 'plain',
			};
		} catch (error) {
			this.logger.error(`Ошибка оформления заказа для пользователя ${ctx.telegramId}: ${error}`);
			return this.createErrorResponse(MESSAGES.TELEGRAM_CHECKOUT_FAILED);
		}
	}

	async handleAddToCart(
		ctx: ExtendedContext,
		productId: number,
	): Promise<TelegramBotResponse | null> {
		try {
			this.telegramUtils.validateId(productId, 'PRODUCT');
			const product = await this.productsService.getProductById(
				productId,
				ctx.user.id,
				ctx.user.role as Role,
			);
			if (!product) {
				this.logger.warn(`Товар ${productId} не найден для пользователя ${ctx.telegramId}`);
				return this.createErrorResponse(
					ctx.user.cityId ? MESSAGES.TELEGRAM_INVALID_PRODUCT : MESSAGES.TELEGRAM_NO_CITY_SELECTED,
					true,
				);
			}
			const cartAddDto = { productId, quantity: 1 };
			await this.cartService.addCartItem(ctx.user.id, cartAddDto);
			if (process.env.DEBUG_LOGGING === 'true') {
				this.logger.log(`Товар ${productId} добавлен в корзину для пользователя ${ctx.telegramId}`);
			}
			await ctx.answerCbQuery(
				MESSAGES.TELEGRAM_ITEM_ADDED_TO_CART.replace('{{productName}}', product.name),
			);
			return null;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : MESSAGES.TELEGRAM_ERROR;
			this.logger.error(`Ошибка в handleAddToCart: ${errorMessage}`);
			if (errorMessage === MESSAGES.PRODUCT_OUT_OF_STOCK) {
				return {
					message: 'Товар закончился',
					keyboard: this.createCancelOnlyKeyboard(),
					format: 'plain',
					editMessage: true,
				};
			}
			if (errorMessage === MESSAGES.PRODUCT_INSUFFICIENT_STOCK) {
				return {
					message: 'Недостаточно товара на складе',
					keyboard: this.createCancelOnlyKeyboard(),
					format: 'plain',
					editMessage: true,
				};
			}
			return this.createErrorResponse(errorMessage, true);
		}
	}

	async handleCitySelection(ctx: ExtendedContext, cityId: number): Promise<TelegramBotResponse> {
		this.telegramUtils.validateId(cityId, 'CITY');
		await this.prismaService.validateCity(cityId);

		try {
			await this.cartService.removeAllCartItems(ctx.user.id);
			const dto: UserUpdateProfileDto = {
				cityId,
				addresses: [],
			};
			const currentUser = { id: ctx.user.id, role: ctx.user.role as Role };
			await this.usersService.updateUserProfile(ctx.user.id, dto, currentUser);

			const addressesAfterUpdate = await this.prismaService.findUserAddresses(ctx.user.id);
			if (addressesAfterUpdate.length > 0) {
				this.logger.error(
					`Адреса не были удалены для пользователя ${ctx.telegramId}: ${JSON.stringify(addressesAfterUpdate)}`,
				);
			}

			await ctx.answerCbQuery('Город изменён. Корзина и адрес доставки очищены.');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Неизвестная ошибка при смене города';
			this.logger.error(
				`Ошибка при смене города для пользователя ${ctx.telegramId}: ${errorMessage}`,
			);
			return this.createErrorResponse(`Ошибка при смене города: ${errorMessage}`, true);
		}

		this.telegramUtils.resetSessionFlags(ctx, { awaitingCategories: true });
		const existingCategories = await this.prismaService.client.categoryModel.findMany({
			where: { users: { some: { telegramId: ctx.telegramId } } },
			select: { id: true },
		});
		return existingCategories.length
			? this.handleProductsCommand(ctx)
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
		return this.handleProductsCommand(ctx);
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

	private async renderProducts(
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

		const products = await this.productsService.getProductsForUser(ctx.telegramId, pagination);
		if (!products.items.length) {
			this.logger.warn(`Товары не найдены для пользователя ${ctx.telegramId}`);
			return {
				message: MESSAGES.TELEGRAM_NO_PRODUCTS,
				keyboard: this.createCancelOnlyKeyboard(),
				format: 'plain',
				editMessage: pagination.page !== 1,
			};
		}

		const productList = products.items
			.map(
				(p: ProductWithRelations) =>
					`*${p.name.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')}*\n` +
					`${p.description?.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1') ?? ''}\n` +
					`Цена: ${p.price.toFixed(2)} руб.\n` +
					`В наличии: ${p.quantity} шт.`,
			)
			.join('\n\n');

		const keyboard = this.createInlineKeyboard(
			products.items,
			(product) => `Добавить в корзину: ${product.name.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '')}`,
			(product) => `${TELEGRAM_ACTIONS.ADD_TO_CART}_${product.id}`,
			[
				{
					text: TELEGRAM_BUTTONS.FINISH_ADD_TO_CART,
					callback: TELEGRAM_ACTIONS.FINISH_ADD_TO_CART,
				},
			],
			{
				page: pagination.page,
				totalPages: products.meta.totalPages,
				actionPrefix: TELEGRAM_ACTIONS.PREV_PRODUCT_PAGE,
			},
		);

		return {
			message: `Товары для ваших категорий:\n\n${productList}\n\nСтраница ${products.meta.page} из ${products.meta.totalPages}`,
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
		const buttons = items.map((item) => [
			Markup.button.callback(getText(item) || TELEGRAM_BUTTONS.ADD_TO_CART, getCallback(item)),
		]);
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
				['/setcity', '/setcategories', '/setaddress'],
				['/viewcity', '/viewcategories', '/viewaddress'],
				['/removecategories', '/products', '/cart'],
				['/checkout', '/help'],
			],
			resize_keyboard: true,
		};
	}
}
