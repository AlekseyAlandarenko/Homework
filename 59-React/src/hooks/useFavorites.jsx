import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { MOVIES } from '../constants/movies.jsx';

export const useFavorites = () => {
	const { favorites, isFavorite, toggleFavorite } = useAuth();

	const favoriteMovies = useMemo(() => {
		return favorites
			.map((id) => MOVIES.find((movie) => movie.id === id))
			.filter(Boolean);
	}, [favorites]);

	return {
		favoriteMovies,
		isFavorite,
		toggleFavorite
	};
};