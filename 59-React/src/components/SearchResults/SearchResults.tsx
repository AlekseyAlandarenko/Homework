import { FC } from 'react';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './SearchResults.module.css';
import type { Movie } from '../../interfaces/movie.interface';
import { MoviesGrid } from '../MoviesGrid/MoviesGrid';

interface MovieWithFavorite extends Movie {
  isFavorite: boolean;
}

interface SearchResultsProps {
  isLoading: boolean;
  isSearchPerformed: boolean;
  filteredMovies: MovieWithFavorite[];
  onAddToFavorites: (movie: Movie) => void;
  error?: string | null;
}

export const SearchResults: FC<SearchResultsProps> = ({
	isLoading,
	isSearchPerformed,
	filteredMovies,
	onAddToFavorites,
	error
}) => {
	if (isLoading) {
		return <div className={styles.loader} aria-label={TEXT_CONSTANTS.COMMON.LOADING} />;
	}

	if (
		(error && error === TEXT_CONSTANTS.ERRORS.NO_RESULTS) ||
    (isSearchPerformed && filteredMovies.length === 0)
	) {
		return (
			<div className={styles['not-found']}>
				<div className={styles['not-found-container']}>
					<div className={styles['not-found-text']}>
						<Title level={2}>{TEXT_CONSTANTS.SEARCH_PAGE.NOT_FOUND_TITLE}</Title>
						<Paragraph size="large" className={styles['not-found-description']}>
							{TEXT_CONSTANTS.SEARCH_PAGE.NOT_FOUND_DESCRIPTION}
						</Paragraph>
					</div>
				</div>
			</div>
		);
	}

	return (
		<MoviesGrid
			movies={filteredMovies}
			onAddToFavorites={onAddToFavorites}
			marginOffset={320}
		/>
	);
};