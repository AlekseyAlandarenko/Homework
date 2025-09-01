import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { toggleFavorite } from '../store/usersSlice';
import { Movie } from '../interfaces/movie.interface';
import { useNavigation } from './useNavigation';
import { selectCurrentProfile, selectCurrentAccountId } from '../store/usersSelectors';
import { makeSelectIsFavorite } from '../store/moviesSelectors';

export const useFavorite = (movieId?: string) => {
	const dispatch = useDispatch();
	const { canAccess, handleNavigate } = useNavigation();
	const currentAccountId = useSelector(selectCurrentAccountId);
	const profile = useSelector(selectCurrentProfile);

	const isFavorite = useSelector(makeSelectIsFavorite(movieId));

	const toggle = useCallback(
		(movie: Movie) => {
			if (!movie.id) return;
			if (!canAccess('/favorites')) {
				handleNavigate('/login?redirect=%2Ffavorites');
				return;
			}
			if (!currentAccountId || !profile) return;
			dispatch(
				toggleFavorite({
					account: currentAccountId,
					profile: profile.name,
					movie
				})
			);
		},
		[dispatch, currentAccountId, profile, canAccess, handleNavigate]
	);

	return {
		isFavorite,
		toggle
	};
};