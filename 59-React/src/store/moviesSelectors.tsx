import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store';
import { moviesAdapter } from './moviesSlice';
import type { Movie } from '../interfaces/movie.interface';
import { decodeHtml } from '../utils/stringUtils';
import { PLACEHOLDER_CARD } from '../constants/imageConstants';
import { TEXT_CONSTANTS } from '../constants/textConstants';

export const moviesSelectors = moviesAdapter.getSelectors<RootState>(
	(state) => state.movies.movies
);

export const selectCachedMovies = moviesSelectors.selectEntities;

export const makeSelectMovieDetails = (movieId: string) =>
	createSelector(
		[selectCachedMovies],
		(movies) => {
			const movie = movies[movieId];
			return {
				id: movieId,
				displayTitle: movie ? decodeHtml(movie.title) : TEXT_CONSTANTS.COMMON.LOADING,
				displayImage: movie?.imageSrc || PLACEHOLDER_CARD,
				displayViews: movie?.views ?? 0,
				movie,
				normalizedRating: movie?.rating ?? 0,
				isLoading: !movie,
				isMissing: !movie
			};
		}
	);

export const makeSelectSearchResultsWithFavorites = createSelector(
	[(state: RootState) => state.movies.search.results, selectCachedMovies, (state: RootState) => state.users],
	(resultIds, movies, users) => {
		const currentProfileId = users.currentProfileId;
		const profile = currentProfileId
			? users.profiles.entities[currentProfileId]
			: null;

		const favoriteIds = new Set(profile?.favorites?.map((m: Movie) => m.id) || []);

		return resultIds
			.map((id: string) => movies[id])
			.filter((movie: Movie | undefined): movie is Movie => Boolean(movie))
			.map((movie: Movie) => ({
				...movie,
				isFavorite: favoriteIds.has(movie.id)
			}));
	}
);