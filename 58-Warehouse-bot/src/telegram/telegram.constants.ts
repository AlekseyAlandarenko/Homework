export const TELEGRAM_ACTIONS = {
	SELECT_CITY: 'select_city',
	SELECT_CATEGORY: 'select_category',
	REMOVE_CATEGORY: 'remove_category',
	FINISH_CATEGORIES: 'finish_categories',
	FINISH_REMOVE_CATEGORIES: 'finish_remove_categories',
	CANCEL_ACTION: 'cancel_action',
	PREV_PAGE: 'prev_page',
	NEXT_PAGE: 'next_page',
	PREV_PRODUCT_PAGE: 'prev_product_page',
	NEXT_PRODUCT_PAGE: 'next_product_page',
	ADD_TO_CART: 'add_to_cart',
	SELECT_ADDRESS: 'select_address',
	AWAITING_ADDRESS_INPUT: 'awaiting_address_input',
	FINISH_ADD_TO_CART: 'finish_add_to_cart',
	SEARCH_PRODUCTS: 'search_products',
	REMOVE_FROM_CART: 'remove_from_cart',
	SELECT_OPTION: 'select_option',
	CONFIRM_CHECKOUT: 'confirm_checkout',
} as const;

export type CallbackAction = (typeof TELEGRAM_ACTIONS)[keyof typeof TELEGRAM_ACTIONS];

export const TELEGRAM_BUTTONS = {
	FINISH_CATEGORIES: 'Завершить выбор категорий',
	FINISH_REMOVE_CATEGORIES: 'Завершить удаление категорий',
	CANCEL: 'Отмена',
	PREV_PAGE: '⬅️ Назад',
	NEXT_PAGE: 'Вперед ➡️',
	ADD_TO_CART: 'Добавить в корзину',
	FINISH_ADDRESS: 'Завершить ввод адреса',
	FINISH_ADD_TO_CART: 'Завершить добавление в корзину',
	SEARCH_PRODUCTS: 'Поиск товаров',
	REMOVE_FROM_CART: 'Удалить из корзины',
	SELECT_OPTION: 'Выбрать вариант',
	CONFIRM_CHECKOUT: 'Подтвердить заказ',
} as const;
