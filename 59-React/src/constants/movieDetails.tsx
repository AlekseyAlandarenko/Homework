import { TEXT_CONSTANTS } from './textConstants';
import { Field } from '../components/MovieDetails/MovieDetails';
import { Movie } from '../interfaces/movie.interface';

export const MOVIE_DETAILS_FIELDS: readonly Field<Movie>[] = [
	{ key: 'type', label: TEXT_CONSTANTS.MOVIE_PAGE.TYPE },
	{ key: 'releaseDate', label: TEXT_CONSTANTS.MOVIE_PAGE.RELEASE_DATE },
	{ key: 'runtime', label: TEXT_CONSTANTS.MOVIE_PAGE.RUNTIME },
	{ key: 'genres', label: TEXT_CONSTANTS.MOVIE_PAGE.GENRES }
];