import type { LoaderFunctionArgs } from 'react-router-dom';
import { store } from '../store/store';
import { TEXT_CONSTANTS } from '../constants/textConstants';
import { fetchMovieById } from '../store/moviesSlice';
import { hasCompleteMovieData, selectIsMovieCached } from '../utils/movieCacheUtils';
import { Movie } from '../interfaces/movie.interface';

export async function movieLoader({ params }: LoaderFunctionArgs) {
	const { id } = params;

	if (!id) {
		throw new Response(TEXT_CONSTANTS.ERRORS.MISSING_MOVIE_ID, {
			status: 400,
			statusText: TEXT_CONSTANTS.ERRORS.MISSING_MOVIE_ID
		});
	}

	const state = store.getState();
	const isCached = selectIsMovieCached(id)(state);
	const cachedMovie = state.movies.movies.entities[id];

	if (isCached && cachedMovie && hasCompleteMovieData(cachedMovie)) {
		return { movie: cachedMovie };
	}

	const result = await store.dispatch(fetchMovieById(id));

	if (fetchMovieById.fulfilled.match(result)) {
		return { movie: result.payload as Movie };
	}

	if (result.payload === TEXT_CONSTANTS.ERRORS.MOVIE_NOT_FOUND) {
		throw new Response(TEXT_CONSTANTS.ERRORS.MOVIE_NOT_FOUND, {
			status: 404,
			statusText: TEXT_CONSTANTS.ERRORS.MOVIE_NOT_FOUND
		});
	}

	throw new Response(
		result.payload || TEXT_CONSTANTS.ERRORS.FAILED_TO_LOAD_MOVIE,
		{
			status: 500,
			statusText: TEXT_CONSTANTS.ERRORS.FAILED_TO_LOAD_MOVIE
		}
	);
}