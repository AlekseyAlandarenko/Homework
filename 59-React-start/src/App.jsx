import styles from './App.module.css';
import { useState } from 'react';
import Header from './components/Header/Header';
import Title from './components/Title/Title';
import Paragraph from './components/Paragraph/Paragraph';
import Button from './components/Button/Button';
import Input from './components/Input/Input';
import Icon from './components/Icon/Icon';
import MovieCard from './components/MovieCard/MovieCard';
import SearchIcon from './components/Input/SearchIcon.svg';
import { MOVIES } from './constants.jsx';

function App() {
	const [searchQuery, setSearchQuery] = useState('');
	const [favorites, setFavorites] = useState(new Set());

	const handleInputChange = (e) => {
		setSearchQuery(e.target.value);
	};

	const handleToggleFavorite = (id) => {
		setFavorites((prev) => {
			const newFavorites = new Set(prev);
			if (newFavorites.has(id)) {
				newFavorites.delete(id);
			} else {
				newFavorites.add(id);
			}
			return newFavorites;
		});
	};

	return (
		<div className={styles.app}>
			<Header badgeValue={favorites.size} />
			<div className={styles['search-container']}>
				<Title level={1}>Поиск</Title>
				<Paragraph size="regular">
          Введите название фильма, сериала или мультфильма для поиска и добавления
          в избранное.
				</Paragraph>
				<div className={styles['search-row']}>
					<div className={styles['input-wrapper-fixed']}>
						<Input
							value={searchQuery}
							onChange={handleInputChange}
							placeholder="Введите название"
							appearance="text"
							icon={<Icon src={SearchIcon} alt="Поиск" />}
						/>
					</div>
					<Button
						modifiers={['buttonSearch']}
						onClick={() => alert(`Вы ищете: ${searchQuery}`)}
					>
  Искать
					</Button>
				</div>
			</div>
			<div className={styles['movies-grid']}>
				{MOVIES.map((movie) => (
					<MovieCard
						key={movie.id}
						title={movie.title}
						imageSrc={movie.imageSrc}
						views={movie.views}
						isFavorite={favorites.has(movie.id)}
						onAddToFavorites={() => handleToggleFavorite(movie.id)}
					/>
				))}
			</div>
		</div>
	);
}

export default App;