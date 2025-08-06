import { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { useMovies } from '../../hooks/useMovies';
import { MOVIES } from '../../constants/movieData';
import { ViewsIcon } from '../../assets/icons/ViewsIcon';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './MoviePage.module.css';
import { Badge } from '../Badge/Badge';

const staticDescription =
  'After the devastating events of Avengers: Infinity War, the universe is in ruins due to the efforts of the Mad Titan, Thanos. With the help of remaining allies, the Avengers must assemble once more in order to undo Thanos';

const staticReview = {
	title: 'Not as good as infinity war..',
	date: '2019-04-29',
	text: 'But its a pretty good film. A bit of a mess in some parts, lacking the cohesive and effortless feel infinity war somehow managed to accomplish. Some silly plot holes and characters that could&apos;ve been cut (Ahem, captain marvel and thanos). The use of Captain marvel in this film was just ridiculous. Shes there at the start, bails for some reason? And then pops up at the end to serve no purpose but deux ex machina a space ship...'
};

export const MoviePage: FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { isFavorite, handleToggleFavorite } = useMovies();

	const movie = MOVIES.find((m) => m.id === Number(id));
	if (!movie) {
		return (
			<div className={styles['movie-page-container']}>
				<Title level={3}>Фильм не найден</Title>
				<Paragraph size="large">Проверьте ID фильма или вернитесь на главную страницу.</Paragraph>
			</div>
		);
	}

	const { id: movieId, title, imageSrc, views } = movie;
	const isMovieFavorite = isFavorite(movieId);

	const toggleFavorite = () => {
		const success = handleToggleFavorite(movieId);
		if (!success) navigate('/login');
	};

	const renderMovieDetails = () => {
		const details = {
			Тип: 'Movie',
			'Дата выхода': '2019-04-24',
			Длительность: '181 мин',
			Жанр: 'Adventure, Science Fiction, Action'
		};

		return Object.entries(details).map(([label, value]) => (
			<div className={styles['movie-detail']} key={label}>
				<Paragraph className={styles['movie-detail-label']}>{label}</Paragraph>
				<Paragraph className={styles['movie-detail-value']}>{value}</Paragraph>
			</div>
		));
	};

	const renderReview = () => (
		<div className={styles['review-item']}>
			<Title level={2} className={styles['review-title']}>
        Отзывы
			</Title>
			<div className={styles['review-detail']}>
				<div className={classNames(styles['movie-page-review-header'])}>
					<Paragraph className={styles['review-header-title']}>{staticReview.title}</Paragraph>
					<Paragraph className={styles['review-date']}>{staticReview.date}</Paragraph>
				</div>
				<Paragraph className={styles['review-text']}>{staticReview.text}</Paragraph>
			</div>
		</div>
	);

	return (
		<div className={styles['movie-page-container']}>
			<div className={styles['title-item']}>
				<Title level={3}>{title}</Title>
			</div>

			<div className={styles['movie-page-image-info-container']}>
				<div className={styles['movie-image-wrapper']}>
					<img src={imageSrc} alt={title} className={styles['movie-image']} loading="lazy" />
				</div>

				<div className={styles['movie-info']}>
					<Paragraph className={styles['movie-description']}>{staticDescription}</Paragraph>

					<div className={styles['movie-page-actions-container']}>
						<Badge icon={<ViewsIcon />} value={views} />
			
						<ToggleButton
							isActive={isMovieFavorite}
							onClick={toggleFavorite}
							activeText={TEXT_CONSTANTS.MOVIE_CARD.IN_FAVORITES}
							inactiveText={TEXT_CONSTANTS.MOVIE_CARD.ADD_TO_FAVORITES}
						/>
					</div>

					{renderMovieDetails()}
				</div>
			</div>

			{renderReview()}
		</div>
	);
};