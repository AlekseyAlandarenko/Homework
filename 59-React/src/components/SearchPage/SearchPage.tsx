import { FC, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { HeaderWrapper } from '../HeaderWrapper/HeaderWrapper';
import { InputButtonRow } from '../InputButtonRow/InputButtonRow';
import { SearchResults } from '../SearchResults/SearchResults';
import { SearchIcon } from '../../assets/icons/SearchIcon';
import { RootState, AppDispatch } from '../../store/store';
import { searchMovies, clearError } from '../../store/moviesSlice';
import { makeSelectSearchResultsWithFavorites } from '../../store/moviesSelectors';
import styles from './SearchPage.module.css';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import { useFavorite } from '../../hooks/useFavorite';

export const SearchPage: FC = () => {
	const dispatch: AppDispatch = useDispatch();
	const [searchQuery, setSearchQuery] = useState('');

	const { toggle } = useFavorite();

	const resultsWithFavorites = useSelector(makeSelectSearchResultsWithFavorites);
	const isLoading = useSelector((state: RootState) => state.movies.loading);
	const error = useSelector((state: RootState) => state.movies.error);
	const isSearchPerformed = useSelector(
		(state: RootState) => state.movies.search.isSearchPerformed
	);

	const errorMessage =
	error && error !== TEXT_CONSTANTS.ERRORS.NO_RESULTS
		? error === TEXT_CONSTANTS.ERRORS.QUERY_TOO_SHORT
			? TEXT_CONSTANTS.ERRORS.QUERY_TOO_SHORT
			: TEXT_CONSTANTS.GLOBAL.ERROR_DESCRIPTION
		: undefined;

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setSearchQuery(value);

			if (error === TEXT_CONSTANTS.ERRORS.QUERY_TOO_SHORT) {
				dispatch(clearError());
			}
		},
		[error, dispatch]
	);

	const handleSearch = useCallback(() => {
		const trimmedQuery = searchQuery.trim();
		if (trimmedQuery) {
			dispatch(searchMovies(trimmedQuery));
		}
	}, [searchQuery, dispatch]);

	return (
		<div>
			<div className={styles['search-container']}>
				<HeaderWrapper
					title={TEXT_CONSTANTS.SEARCH_PAGE.TITLE}
					description={TEXT_CONSTANTS.SEARCH_PAGE.DESCRIPTION}
				>
					<InputButtonRow
						value={searchQuery}
						onChange={handleInputChange}
						placeholder={TEXT_CONSTANTS.SEARCH_PAGE.SEARCH_PLACEHOLDER}
						name="searchQuery"
						buttonText={TEXT_CONSTANTS.SEARCH_PAGE.SEARCH_BUTTON}
						onButtonClick={handleSearch}
						isLoading={isLoading}
						icon={<SearchIcon aria-label={TEXT_CONSTANTS.A11Y.SEARCH_ICON} />}
						error={errorMessage}
						ariaLabel={TEXT_CONSTANTS.SEARCH_PAGE.SEARCH_INPUT_LABEL}
					/>
				</HeaderWrapper>
			</div>

			<div className={styles['movies-grid']}>
				<SearchResults
					isLoading={isLoading}
					isSearchPerformed={isSearchPerformed}
					filteredMovies={resultsWithFavorites}
					onAddToFavorites={toggle}
					error={error}
				/>
			</div>
		</div>
	);
};