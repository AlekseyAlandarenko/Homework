export const TELEGRAM_ACTIONS = {
	SELECT_CITY: 'select_city',
	SELECT_CATEGORY: 'select_category',
	REMOVE_CATEGORY: 'remove_category',
	FINISH_CATEGORIES: 'finish_categories',
	FINISH_REMOVE_CATEGORIES: 'finish_remove_categories',
	CANCEL_ACTION: 'cancel_action',
	PREV_PAGE: 'prev_page',
	NEXT_PAGE: 'next_page',
	PREV_PROMOTION_PAGE: 'prev_promotion_page',
	NEXT_PROMOTION_PAGE: 'next_promotion_page',
} as const;

export type CallbackAction = (typeof TELEGRAM_ACTIONS)[keyof typeof TELEGRAM_ACTIONS];

export const TELEGRAM_BUTTONS = {
	FINISH_CATEGORIES: 'Завершить выбор категорий',
	FINISH_REMOVE_CATEGORIES: 'Завершить удаление категорий',
	CANCEL: 'Отмена',
	PREV_PAGE: '⬅️ Назад',
	NEXT_PAGE: 'Вперед ➡️',
} as const;
