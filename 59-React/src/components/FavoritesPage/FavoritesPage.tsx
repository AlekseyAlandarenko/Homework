import { FC } from 'react';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import { MovieCard } from '../MovieCard/MovieCard';
import { useMovies } from '../../hooks/useMovies';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './FavoritesPage.module.css';

interface Movie {
  id: number;
  title: string;
  imageSrc: string;
  views: number;
}

function getMovieDeclension(count: number): string {
	const forms = ['избранный фильм', 'избранных фильма', 'избранных фильмов'];
	if (count % 100 >= 11 && count % 100 <= 14) return forms[2];
	switch (count % 10) {
	case 1:
		return forms[0];
	case 2:
	case 3:
	case 4:
		return forms[1];
	default:
		return forms[2];
	}
}

export const FavoritesPage: FC = () => {
	const { favoriteMovies, isFavorite, handleToggleFavorite } = useMovies();

	const getDescriptionText = () => {
		return favoriteMovies.length > 0
			? `У вас ${favoriteMovies.length} ${getMovieDeclension(favoriteMovies.length)}`
			: TEXT_CONSTANTS.FAVORITES_PAGE.NO_FAVORITES;
	};

	const renderHeader = () => (
		<div className={styles['favorites-header']}>
			<Title level={1}>{TEXT_CONSTANTS.FAVORITES_PAGE.TITLE}</Title>
			<Paragraph size="regular">
				{getDescriptionText()}
			</Paragraph>
		</div>
	);

	const renderContent = () => {
		return favoriteMovies.map((movie: Movie) => (
			<MovieCard
				key={movie.id}
				id={movie.id}
				title={movie.title}
				imageSrc={movie.imageSrc}
				views={movie.views}
				isFavorite={isFavorite(movie.id)}
				onAddToFavorites={() => handleToggleFavorite(movie.id)}
			/>
		));
	};

	return (
		<div className={styles.container}>
			<div className={styles['fixed-section']}>
				<div>
					{renderHeader()}
				</div>
			</div>
			<div className={styles['movies-grid']}>
				{renderContent()}
			</div>
		</div>
	);
};