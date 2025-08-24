import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import usersReducer, { UsersState } from './usersSlice';
import moviesReducer, { MoviesState } from './moviesSlice';

export interface RootState {
  users: UsersState;
  movies: MoviesState;
}

const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['accounts', 'profiles', 'currentAccountId', 'currentProfileId', 'movies']
};

const ignoredPaths = [
	'users.profiles.entities',
	'users.accounts.entities',
	'movies.movies.entities',
	'users.modal',
	'movies.search'
];

export const store = configureStore({
	reducer: {
		users: persistReducer(persistConfig, usersReducer),
		movies: persistReducer(persistConfig, moviesReducer)
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
				ignoredPaths
			},
			immutableCheck: {
				ignoredPaths
			}
		})
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;