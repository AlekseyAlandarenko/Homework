import { FC } from 'react';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { MovieCard } from '../MovieCard/MovieCard';
import { useSearch } from '../../hooks/useSearch';
import { useMovies } from '../../hooks/useMovies';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import { SearchIcon } from '../../assets/icons/SearchIcon';
import styles from './SearchPage.module.css';

export const SearchPage: FC = () => {
	const {
		searchQuery,
		filteredMovies,
		isSearchPerformed,
		searchInputRef,
		handleInputChange,
		handleSearch
	} = useSearch();

	const { handleToggleFavorite, isFavorite } = useMovies();

	const renderSearchInput = () => (
		<div className={styles['search-row']}>
			<Input
				ref={searchInputRef}
				value={searchQuery}
				onChange={handleInputChange}
				placeholder={TEXT_CONSTANTS.SEARCH_PAGE.SEARCH_PLACEHOLDER}
				variant="search"
				icon={<SearchIcon className={styles['search-icon']} />}
				className={styles['search-input']}
			/>
			<Button
				variant="search"
				onClick={handleSearch}
			>
				{TEXT_CONSTANTS.SEARCH_PAGE.SEARCH_BUTTON}
			</Button>
		</div>
	);

	const renderContent = () => {
		if (isSearchPerformed && filteredMovies.length === 0) {
			return (
				<div className={styles['not-found']}>
					<div className={styles['not-found-container']}>
						<div className={styles['not-found-text']}>
							<Title level={2}>{TEXT_CONSTANTS.SEARCH_PAGE.NOT_FOUND_TITLE}</Title>
							<Paragraph size="large">
								{TEXT_CONSTANTS.SEARCH_PAGE.NOT_FOUND_DESCRIPTION}
							</Paragraph>
						</div>
					</div>
				</div>
			);
		}

		return filteredMovies.map((movie) => (
			<MovieCard
				key={movie.id}
				id={movie.id}
				title={movie.title}
				imageSrc={movie.imageSrc}
				views={movie.views}
				isFavorite={isFavorite(movie.id)}
				onAddToFavorites={() => handleToggleFavorite(movie.id)}
			/>
		));
	};

	return (
		<div>
			<div className={styles['search-container']}>
				<div className={styles['search-header']}>
					<div className={styles['search-header-text']}>
						<Title level={1}>{TEXT_CONSTANTS.SEARCH_PAGE.TITLE}</Title>
						<Paragraph size="regular">
							{TEXT_CONSTANTS.SEARCH_PAGE.DESCRIPTION}
						</Paragraph>
					</div>
					{renderSearchInput()}
				</div>
			</div>
			<div className={styles['movies-grid']}>
				{renderContent()}
			</div>
		</div>
	);
};