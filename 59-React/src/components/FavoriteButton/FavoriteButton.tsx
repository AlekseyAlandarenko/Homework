import { FC, memo } from 'react';
import { FavoriteToggle } from '../FavoriteToggle/FavoriteToggle';
import { useFavorite } from '../../hooks/useFavorite';
import type { Movie } from '../../interfaces/movie.interface';

interface FavoriteButtonProps {
  movie: Movie;
}

export const FavoriteButton: FC<FavoriteButtonProps> = memo(({ movie }) => {
	const { isFavorite, toggle } = useFavorite(movie.id);

	return <FavoriteToggle isActive={isFavorite} onClick={() => toggle(movie)} />;
});