import { FC } from 'react';
import { MovieCard } from '../MovieCard/MovieCard';
import { Movie } from '../../interfaces/movie.interface';
import styles from './MoviesGrid.module.css';

interface MovieWithFavorite extends Movie {
  isFavorite: boolean;
}

interface MoviesGridProps {
  movies: MovieWithFavorite[];
  onAddToFavorites: (movie: Movie) => void;
  marginOffset?: number;
}

export const MoviesGrid: FC<MoviesGridProps> = ({ movies, marginOffset }) => {
	const gridStyle = { margin: `calc(var(--space-80) + ${marginOffset}px) auto 0` };

	return (
		<div className={styles['movies-grid']} style={gridStyle}>
			{movies.map((movie) => (
				<MovieCard key={movie.id} id={movie.id} />
			))}
		</div>
	);
};