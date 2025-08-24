import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '../store/store';
import { toggleFavorite } from '../store/usersSlice';
import { Movie } from '../interfaces/movie.interface';
import { useNavigation } from './useNavigation';

export const useFavorite = (movieId?: string) => {
	const dispatch = useDispatch();
	const { canAccess, handleNavigate } = useNavigation();
	const currentAccountId = useSelector((state: RootState) => state.users.currentAccountId);
	const currentProfileId = useSelector((state: RootState) => state.users.currentProfileId);
	const profile = useSelector((state: RootState) =>
		currentProfileId ? state.users.profiles.entities[currentProfileId] : null
	);

	const isFavorite = useSelector((state: RootState) => {
		if (!movieId) return false;
		if (!currentProfileId) return false;
		const profile = state.users.profiles.entities[currentProfileId];
		return profile?.favorites?.some((m) => m.id === movieId) ?? false;
	});

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