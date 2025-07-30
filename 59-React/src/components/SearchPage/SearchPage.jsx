import styles from './SearchPage.module.css';
import { useCallback, useMemo } from 'react';
import Header from '../Header/Header';
import Title from '../Title/Title';
import Paragraph from '../Paragraph/Paragraph';
import Button from '../Button/Button';
import Input from '../Input/Input';
import Icon from '../Icon/Icon';
import MovieCard from '../MovieCard/MovieCard';
import SearchIcon from '../../assets/icons/SearchIcon.svg';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProtectedNavigation } from '../../hooks/useProtectedNavigation.jsx';
import { useSearch } from '../../hooks/useSearch.jsx';
import classNames from 'classnames';

function SearchPage() {
	const {
		searchQuery,
		filteredMovies,
		isSearchPerformed,
		searchInputRef,
		handleInputChange,
		handleSearch
	} = useSearch();
	const { favorites, toggleFavorite, isFavorite, navLinks } = useAuth();
	const protectNavigation = useProtectedNavigation();

	const handleToggleFavorite = useCallback(
		(id) => {
			protectNavigation(() => toggleFavorite(id));
		},
		[protectNavigation, toggleFavorite]
	);

	const movieCards = useMemo(() => {
		return filteredMovies.map((movie) => (
			<MovieCard
				key={movie.id}
				title={movie.title}
				imageSrc={movie.imageSrc}
				views={movie.views}
				isFavorite={isFavorite(movie.id)}
				onAddToFavorites={() => handleToggleFavorite(movie.id)}
			/>
		));
	}, [filteredMovies, isFavorite, handleToggleFavorite]);

	return (
		<div className={classNames('page-container')}>
			<Header badgeValue={favorites.length} navLinks={navLinks} />
			<div className="fixed-section">
				<div className={styles['search-container']}>
					<Title level={1}>Поиск</Title>
					<Paragraph size="regular">
            Введите название фильма, сериала или мультфильма для поиска и добавления в избранное.
					</Paragraph>
					<div className={styles['search-row']}>
						<Input
							ref={searchInputRef}
							value={searchQuery}
							onChange={handleInputChange}
							placeholder="Введите название"
							appearance="text"
							icon={<Icon src={SearchIcon} alt="Поиск" />}
							className={styles['search-input']}
						/>
						<Button
							modifiers={['buttonSearch']}
							onClick={handleSearch}
							className={styles['search-button']}
						>
              Искать
						</Button>
					</div>
				</div>
			</div>
			<div className="movies-grid">
				{isSearchPerformed && filteredMovies.length === 0 ? (
					<div className={styles['not-found']}>
						<div className={styles['not-found-container']}>
							<Title level={2}>Упс... Ничего не найдено</Title>
							<Paragraph size="large">
                Попробуйте изменить запрос или ввести более точное название фильма
							</Paragraph>
						</div>
					</div>
				) : (
					movieCards
				)}
			</div>
		</div>
	);
}

export default SearchPage;