import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { NAV_LINKS } from '../constants/navLinks.jsx';

const AuthContext = createContext();

const initialState = {
	users: [],
	currentUser: null,
	favorites: [],
	allFavorites: {},
	navLinks: NAV_LINKS(false, '')
};

const reducer = (state, action) => {
	switch (action.type) {
	case 'LOAD_STORAGE': {
		return {
			...state,
			users: action.payload.users || [],
			allFavorites: action.payload.allFavorites || {}
		};
	}
	case 'LOGIN': {
		const { username } = action.payload;
		let existingUser = state.users.find((user) => user.username === username);
		if (!existingUser && state.allFavorites[username]) {
			existingUser = { username };
			return {
				...state,
				users: [...state.users, existingUser],
				currentUser: existingUser,
				favorites: state.allFavorites[username] || [],
				navLinks: NAV_LINKS(true, username)
			};
		}
		if (existingUser) {
			return {
				...state,
				currentUser: existingUser,
				favorites: state.allFavorites[username] || [],
				navLinks: NAV_LINKS(true, username)
			};
		}
		const newUser = { username };
		return {
			...state,
			users: [...state.users, newUser],
			currentUser: newUser,
			favorites: [],
			navLinks: NAV_LINKS(true, username)
		};
	}
	case 'LOGOUT': {
		return {
			...state,
			currentUser: null,
			favorites: [],
			navLinks: NAV_LINKS(false, '')
		};
	}
	case 'EXIT_CURRENT_USER': {
		const remainingUsers = state.users.filter((u) => u.username !== state.currentUser?.username);
		if (remainingUsers.length > 0) {
			const nextUser = remainingUsers[0];
			return {
				...state,
				users: remainingUsers,
				currentUser: nextUser,
				favorites: state.allFavorites[nextUser.username] || [],
				navLinks: NAV_LINKS(true, nextUser.username)
			};
		}
		return {
			...state,
			users: [],
			currentUser: null,
			favorites: [],
			navLinks: NAV_LINKS(false, '')
		};
	}
	case 'TOGGLE_FAVORITE': {
		const id = action.payload;
		const newFavorites = state.favorites.includes(id)
			? state.favorites.filter((favId) => favId !== id)
			: [...state.favorites, id];
		return {
			...state,
			favorites: newFavorites,
			allFavorites: {
				...state.allFavorites,
				[state.currentUser?.username]: newFavorites
			}
		};
	}
	default:
		return state;
	}
};

export function AuthProvider({ children }) {
	const [state, dispatch] = useReducer(reducer, initialState);
	const { users, currentUser, favorites, allFavorites, navLinks } = state;

	useEffect(() => {
		const savedUsers = localStorage.getItem('movieAppUsers');
		const savedAllFavorites = localStorage.getItem('movieAppAllFavorites');
		dispatch({
			type: 'LOAD_STORAGE',
			payload: {
				users: savedUsers ? JSON.parse(savedUsers) : [],
				allFavorites: savedAllFavorites ? JSON.parse(savedAllFavorites) : {}
			}
		});
	}, []);

	useEffect(() => {
		const serializedUsers = JSON.stringify(users);
		if (users.length > 0 && localStorage.getItem('movieAppUsers') !== serializedUsers) {
			localStorage.setItem('movieAppUsers', serializedUsers);
		} else if (users.length === 0) {
			localStorage.removeItem('movieAppUsers');
		}
		const serializedFavorites = JSON.stringify(allFavorites);
		if (localStorage.getItem('movieAppAllFavorites') !== serializedFavorites) {
			localStorage.setItem('movieAppAllFavorites', serializedFavorites);
		}
	}, [users, allFavorites]);

	const login = useCallback((username) => {
		dispatch({ type: 'LOGIN', payload: { username } });
	}, []);

	const logout = useCallback(() => {
		dispatch({ type: 'LOGOUT' });
	}, []);

	const exitCurrentUser = useCallback(() => {
		dispatch({ type: 'EXIT_CURRENT_USER' });
	}, []);

	const toggleFavorite = useCallback((id) => {
		dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
	}, []);

	const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

	return (
		<AuthContext.Provider
			value={{
				user: currentUser,
				users,
				login,
				logout,
				exitCurrentUser,
				favorites,
				toggleFavorite,
				isFavorite,
				navLinks
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

AuthProvider.propTypes = {
	children: PropTypes.node.isRequired
};

export const useAuth = () => useContext(AuthContext);