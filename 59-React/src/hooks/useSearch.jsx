import { useReducer, useEffect, useRef } from 'react';
import { MOVIES } from '../constants/movies.jsx';

const initialState = {
	searchQuery: '',
	filteredMovies: MOVIES,
	isSearchPerformed: false
};

const reducer = (state, action) => {
	switch (action.type) {
	case 'SET_QUERY': {
		return { ...state, searchQuery: action.payload };
	}
	case 'SEARCH': {
		const query = state.searchQuery.trim().toLowerCase();
		return {
			...state,
			filteredMovies: query
				? MOVIES.filter((movie) => movie.title.toLowerCase().includes(query))
				: MOVIES,
			isSearchPerformed: !!query
		};
	}
	default:
		return state;
	}
};

export const useSearch = () => {
	const [state, dispatch] = useReducer(reducer, initialState);
	const searchInputRef = useRef(null);

	useEffect(() => {
		searchInputRef.current?.focus();
	}, []);

	const handleInputChange = (e) => {
		dispatch({ type: 'SET_QUERY', payload: e.target.value });
	};

	const handleSearch = () => {
		dispatch({ type: 'SEARCH' });
	};

	return {
		searchQuery: state.searchQuery,
		filteredMovies: state.filteredMovies,
		isSearchPerformed: state.isSearchPerformed,
		searchInputRef,
		handleInputChange,
		handleSearch
	};
};