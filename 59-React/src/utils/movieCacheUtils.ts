import type { Movie } from '../interfaces/movie.interface';
import type { RootState } from '../store/store';

export const selectIsMovieCached = (movieId: string) => (state: RootState) => 
	state.movies.movies.entities[movieId] !== undefined;

export const hasCompleteMovieData = (movie?: Movie | null): boolean => {
	if (!movie) return false;
  
	return (
		movie.rating >= 0 &&
    movie.plot !== 'N/A' &&
    movie.genres !== 'N/A' &&
    movie.runtime !== 'N/A' &&
    movie.releaseDate !== 'N/A' &&
    !!movie.imageSrc &&
    movie.reviews !== undefined
	);
};