import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { MOVIES } from '../constants/movieData';

interface Movie {
  id: number;
  title: string;
  imageSrc: string;
  views: number;
}

interface UseMoviesReturn {
  favoriteMovies: Movie[];
  isFavorite: (id: number) => boolean;
  handleToggleFavorite: (id: number) => boolean;
}

export const useMovies = (): UseMoviesReturn => {
	const { favorites, isFavorite, toggleFavorite, user } = useAuth();
	const navigate = useNavigate();

	const favoriteMovies = useMemo(
		() => favorites.map((id) => MOVIES.find((movie) => movie.id === id)).filter((movie): movie is Movie => !!movie),
		[favorites]
	);

	const handleToggleFavorite = useCallback(
		(id: number) => {
			if (!user) {
				navigate('/login');
				return false;
			}
			toggleFavorite(id);
			return true;
		},
		[user, toggleFavorite, navigate]
	);

	return {
		favoriteMovies,
		isFavorite,
		handleToggleFavorite
	};
};