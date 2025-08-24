import { FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { HeaderWrapper } from '../HeaderWrapper/HeaderWrapper';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './FavoritesPage.module.css';
import { useFavorite } from '../../hooks/useFavorite';
import { selectCurrentProfile } from '../../store/usersSelectors';
import { getDeclension } from '../../utils/declensionUtils';
import { MoviesGrid } from '../MoviesGrid/MoviesGrid';

export const FavoritesPage: FC = () => {
	const { toggle } = useFavorite();
	const profile = useSelector(selectCurrentProfile);

	const favoriteMovies = useMemo(() => profile?.favorites || [], [profile?.favorites]);

	const count = favoriteMovies.length;

	const description = useMemo(
		() =>
			count === 0
				? TEXT_CONSTANTS.FAVORITES_PAGE.NO_FAVORITES
				: `У вас ${count} ${getDeclension(count, [
					'избранный фильм',
					'избранных фильма',
					'избранных фильмов'
				])}`,
		[count]
	);

	const favoriteMoviesWithFlag = useMemo(
		() =>
			favoriteMovies.map((movie) => ({
				...movie,
				isFavorite: true
			})),
		[favoriteMovies]
	);

	return (
		<div>
			<div className={styles['favorites-container']}>
				<HeaderWrapper title={TEXT_CONSTANTS.FAVORITES_PAGE.TITLE} description={description} />
			</div>

			{count > 0 && (
				<MoviesGrid movies={favoriteMoviesWithFlag} onAddToFavorites={toggle} marginOffset={200} />
			)}
		</div>
	);
};