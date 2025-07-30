import styles from './FavoritesPage.module.css';
import Header from '../Header/Header';
import MovieCard from '../MovieCard/MovieCard';
import Title from '../Title/Title';
import Paragraph from '../Paragraph/Paragraph';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../hooks/useFavorites.jsx';
import classNames from 'classnames';

function getMovieDeclension(count) {
	const lastDigit = count % 10;
	const lastTwoDigits = count % 100;

	if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
		return 'избранных фильмов';
	}
	if (lastDigit === 1) {
		return 'избранный фильм';
	}
	if (lastDigit >= 2 && lastDigit <= 4) {
		return 'избранных фильма';
	}
	return 'избранных фильмов';
}

function FavoritesPage() {
	const { navLinks } = useAuth();
	const { favoriteMovies, isFavorite, toggleFavorite } = useFavorites();

	return (
		<div className={classNames('page-container')}>
			<Header badgeValue={favoriteMovies.length} navLinks={navLinks} />
			<div className="fixed-section">
				<div className={styles['favorites-container']}>
					<Title level={1}>Избранное</Title>
					<Paragraph size="regular">
						{favoriteMovies.length > 0
							? `У вас ${favoriteMovies.length} ${getMovieDeclension(favoriteMovies.length)}`
							: 'У вас пока нет избранных фильмов'}
					</Paragraph>
				</div>
			</div>
			<div className="movies-grid">
				{favoriteMovies.map((movie) => (
					<MovieCard
						key={movie.id}
						title={movie.title}
						imageSrc={movie.imageSrc}
						views={movie.views}
						isFavorite={isFavorite(movie.id)}
						onAddToFavorites={() => toggleFavorite(movie.id)}
					/>
				))}
			</div>
		</div>
	);
}

export default FavoritesPage;