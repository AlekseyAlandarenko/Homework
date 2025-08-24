import { createSlice, PayloadAction, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import axios from 'axios';
import { Movie } from '../interfaces/movie.interface';
import { mapSearchResultToMovie, fetchMovieDetails } from '../utils/movieUtils';
import { RootState } from './store';
import { TEXT_CONSTANTS } from '../constants/textConstants';

export const moviesAdapter = createEntityAdapter<Movie, string>({
	selectId: (movie) => movie.id
});

export interface MoviesState {
  movies: ReturnType<typeof moviesAdapter.getInitialState>;
  search: SearchState;
  loading: boolean;
  error: string | null;
}

interface SearchState {
  query: string;
  results: string[];
  isSearchPerformed: boolean;
  lastFetched?: number;
}

const initialState: MoviesState = {
	movies: moviesAdapter.getInitialState(),
	search: {
		query: '',
		results: [],
		isSearchPerformed: false,
		lastFetched: undefined
	},
	loading: false,
	error: null
};

interface SearchApiResponse {
  description: Array<{
    '#IMDB_ID': string;
    '#TITLE': string;
    '#IMG_POSTER': string;
    '#RANK'?: number;
    '#YEAR'?: number;
  }>;
}

export const searchMovies = createAsyncThunk<
  { query: string; results: Movie[] },
  string,
  { rejectValue: string; state: RootState }
>(
	'movies/searchMovies',
	async (query, { rejectWithValue, getState }) => {
		const trimmedQuery = query.trim();

		if (!trimmedQuery || trimmedQuery.length < 2) {
			return rejectWithValue(TEXT_CONSTANTS.ERRORS.QUERY_TOO_SHORT);
		}

		const state = getState();
		const lastSearch = state.movies.search;

		if (lastSearch.query === trimmedQuery && lastSearch.results.length > 0) {
			const cachedMovies = lastSearch.results
				.map((id) => state.movies.movies.entities[id]!)
				.filter(Boolean);

			if (cachedMovies.length > 0) {
				return {
					query: lastSearch.query,
					results: cachedMovies
				};
			}
		}

		try {
			const response = await axios.get<SearchApiResponse>(
				`https://search.imdbot.workers.dev/?q=${encodeURIComponent(trimmedQuery)}`
			);

			const movies = response.data.description
				.filter((item) => item['#IMG_POSTER'] && item['#TITLE'])
				.map(mapSearchResultToMovie)
				.sort((a, b) => (b.views || 0) - (a.views || 0));

			if (movies.length === 0) {
				return rejectWithValue(TEXT_CONSTANTS.ERRORS.NO_RESULTS);
			}

			return {
				query: trimmedQuery,
				results: movies
			};
		} catch {
			return rejectWithValue(TEXT_CONSTANTS.ERRORS.NETWORK_ERROR);
		}
	}
);

export const fetchMovieById = createAsyncThunk<Movie, string, { rejectValue: string }>(
	'movies/fetchMovieById',
	async (movieId, { rejectWithValue }) => {
		try {
			const movie = await fetchMovieDetails(movieId);
			return movie;
		} catch {
			return rejectWithValue(TEXT_CONSTANTS.ERRORS.MOVIE_NOT_FOUND);
		}
	}
);

export const moviesSlice = createSlice({
	name: 'movies',
	initialState,
	reducers: {
		setSearchQuery: (state, action: PayloadAction<string>) => {
			state.search.query = action.payload;
			state.search.results = [];
			state.search.isSearchPerformed = false;
			state.search.lastFetched = undefined;
		},
		upsertMovies: (state, action: PayloadAction<Movie | Movie[]>) => {
			const movies = Array.isArray(action.payload) ? action.payload : [action.payload];
			moviesAdapter.upsertMany(state.movies, movies);
		},
		clearError: (state) => {
			state.error = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(searchMovies.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(searchMovies.fulfilled, (state, action) => {
				state.loading = false;
				state.search = {
					query: action.payload.query,
					results: action.payload.results.map((m) => m.id),
					isSearchPerformed: true,
					lastFetched: Date.now()
				};
				moviesAdapter.upsertMany(state.movies, action.payload.results);
				state.error = null;
			})
			.addCase(searchMovies.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload || TEXT_CONSTANTS.ERRORS.NETWORK_ERROR;
				state.search.results = [];
				state.search.isSearchPerformed = action.payload === TEXT_CONSTANTS.ERRORS.NO_RESULTS;
				if (action.payload === TEXT_CONSTANTS.ERRORS.QUERY_TOO_SHORT) {
					state.search.isSearchPerformed = false;
				}
			})
			.addCase(fetchMovieById.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchMovieById.fulfilled, (state, action) => {
				state.loading = false;
				moviesAdapter.upsertOne(state.movies, action.payload);
			})
			.addCase(fetchMovieById.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload || TEXT_CONSTANTS.ERRORS.FAILED_TO_LOAD_MOVIE;
			});
	}
});

export const {
	setSearchQuery,
	upsertMovies,
	clearError
} = moviesSlice.actions;

export const selectIsSearchPerformed = (state: RootState) =>
	state.movies.search.isSearchPerformed;

export default moviesSlice.reducer;