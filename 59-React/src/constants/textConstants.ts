export const TEXT_CONSTANTS = {
	SEARCH_PAGE: {
		TITLE: 'Поиск',
		DESCRIPTION: 'Введите название фильма, сериала или мультфильма для поиска и добавления в избранное.',
		NOT_FOUND_TITLE: 'Упс... Ничего не найдено',
		NOT_FOUND_DESCRIPTION: 'Попробуйте изменить запрос или ввести более точное название фильма',
		SEARCH_BUTTON: 'Искать',
		SEARCH_PLACEHOLDER: 'Введите название'
	},
	FAVORITES_PAGE: {
		TITLE: 'Избранное',
		NO_FAVORITES: 'У вас пока нет избранных фильмов'
	},
	LOGIN_PAGE: {
		TITLE: 'Вход',
		USERNAME_PLACEHOLDER: 'Имя пользователя',
		PASSWORD_PLACEHOLDER: 'Пароль',
		LOGIN_BUTTON: 'Войти',
		VALIDATION: {
			EMPTY_FIELDS: 'Пожалуйста, введите имя пользователя и пароль',
			SHORT_USERNAME: 'Имя пользователя должно содержать минимум 3 символа',
			SHORT_PASSWORD: 'Пароль должен содержать минимум 6 символов'
		}
	},
	MOVIE_CARD: {
		ADD_TO_FAVORITES: 'В избранное',
		IN_FAVORITES: 'В избранном'
	},
	HEADER: {
		LOGIN: 'Войти',
		LOGOUT: 'Выйти',
		SEARCH: 'Поиск фильмов',
		FAVORITES: 'Мои фильмы'
	}
} as const;