import { FC, ReactNode, useReducer, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { NAV_LINKS, NavLink } from '../constants/navLinks';

interface User {
  username: string;
}

interface State {
  users: User[];
  currentUser: User | null;
  allFavorites: { [key: string]: number[] };
  navLinks: NavLink[];
}

type Action =
  | { type: 'LOAD_STORAGE'; payload: { users: User[]; allFavorites: { [key: string]: number[] } } }
  | { type: 'LOGIN'; payload: { username: string } }
  | { type: 'SWITCH_USER'; payload?: { username: string } }
  | { type: 'TOGGLE_FAVORITE'; payload: number };

const initialState: State = {
	users: [],
	currentUser: null,
	allFavorites: {},
	navLinks: NAV_LINKS(false, '')
};

const getUpdatedStateForUser = (state: State, username: string): State => {
	const existingUser = state.users.find((user) => user.username === username) || { username };
	const isNewUser = !state.users.some((user) => user.username === username);
	return {
		...state,
		users: isNewUser ? [...state.users, existingUser] : state.users,
		currentUser: existingUser,
		navLinks: NAV_LINKS(true, username)
	};
};

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
	case 'LOAD_STORAGE':
		return {
			...state,
			users: action.payload.users || [],
			allFavorites: action.payload.allFavorites || {}
		};

	case 'LOGIN':
		return getUpdatedStateForUser(state, action.payload.username);

	case 'SWITCH_USER': {
		const { username } = action.payload || {};

		if (username) {
			return getUpdatedStateForUser(state, username);
		}

		const { currentUser, users } = state;

		const remainingUsers = currentUser
			? users.filter((u) => u.username !== currentUser.username)
			: users;

		if (remainingUsers.length > 0) {
			const nextUser = remainingUsers[0];
			return {
				...state,
				users: remainingUsers,
				currentUser: nextUser,
				navLinks: NAV_LINKS(true, nextUser.username)
			};
		}

		return {
			...state,
			users: [],
			currentUser: null,
			navLinks: NAV_LINKS(false, '')
		};
	}

	case 'TOGGLE_FAVORITE': {
		const id = action.payload;
		if (!state.currentUser) {
			return state;
		}
		const currentFavorites = state.allFavorites[state.currentUser.username] || [];
		const newFavorites = currentFavorites.includes(id)
			? currentFavorites.filter((favId: number) => favId !== id)
			: [...currentFavorites, id];
		return {
			...state,
			allFavorites: {
				...state.allFavorites,
				[state.currentUser.username]: newFavorites
			}
		};
	}

	default:
		return state;
	}
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(reducer, initialState);
	const { users, currentUser, allFavorites, navLinks } = state;

	const favorites = useMemo(
		() => (currentUser ? allFavorites[currentUser.username] || [] : []),
		[allFavorites, currentUser]
	);

	useEffect(() => {
		try {
			const savedUsers = localStorage.getItem('movieAppUsers');
			const savedAllFavorites = localStorage.getItem('movieAppAllFavorites');
			dispatch({
				type: 'LOAD_STORAGE',
				payload: {
					users: savedUsers ? JSON.parse(savedUsers) : [],
					allFavorites: savedAllFavorites ? JSON.parse(savedAllFavorites) : {}
				}
			});
		} catch (error) {
			console.error('Ошибка загрузки данных из localStorage:', error);
		}
	}, []);

	useEffect(() => {
		try {
			if (users.length > 0) {
				localStorage.setItem('movieAppUsers', JSON.stringify(users));
			} else {
				localStorage.removeItem('movieAppUsers');
			}
			localStorage.setItem('movieAppAllFavorites', JSON.stringify(allFavorites));
		} catch (error) {
			console.error('Ошибка сохранения данных в localStorage:', error);
		}
	}, [users, allFavorites]);

	const setCurrentUser = useCallback((username: string) => {
		dispatch({ type: 'SWITCH_USER', payload: { username } });
	}, []);

	const logout = useCallback(() => {
		dispatch({ type: 'SWITCH_USER' });
	}, []);

	const toggleFavorite = useCallback((id: number) => {
		dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
	}, []);

	const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites]);

	const contextValue = useMemo(
		() => ({
			user: currentUser,
			users,
			setCurrentUser,
			logout,
			favorites,
			toggleFavorite,
			isFavorite,
			navLinks
		}),
		[currentUser, users, favorites, navLinks, isFavorite, logout, setCurrentUser, toggleFavorite]
	);

	return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};