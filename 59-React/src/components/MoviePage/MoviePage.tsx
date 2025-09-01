import { FC } from 'react';
import { useLoaderData } from 'react-router-dom';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import { StarIcon } from '../../assets/icons/StarIcon';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import { Badge } from '../Badge/Badge';
import { LazyImage } from '../LazyImage/LazyImage';
import { PLACEHOLDER_POSTER } from '../../constants/imageConstants';
import { MovieDetails } from '../MovieDetails/MovieDetails';
import { MovieReviews } from '../MovieReviews/MovieReviews';
import styles from './MoviePage.module.css';
import { MOVIE_DETAILS_FIELDS } from '../../constants/movieDetails';
import { Movie } from '../../interfaces/movie.interface';
import { FavoriteButton } from '../FavoriteButton/FavoriteButton';

type LoaderData = { movie: Movie };

export const MoviePage: FC = () => {
	const { movie } = useLoaderData() as LoaderData;
	const reviews = Array.isArray(movie.reviews) ? movie.reviews : [];

	return (
		<div className={styles['movie-page-container']}>
			<div className={styles['title-item']}>
				<Title level={3}>{movie.title}</Title>
			</div>

			<div className={styles['movie-page-image-info-container']}>
				<div className={styles['movie-image-wrapper']}>
					<LazyImage
						src={movie.imageSrc || PLACEHOLDER_POSTER}
						alt={TEXT_CONSTANTS.MOVIE_PAGE.POSTER_ALT}
						className={styles['movie-image']}
					/>
				</div>

				<div className={styles['movie-info']}>
					<Paragraph size="large" className={styles['movie-description']}>
						{movie.plot}
					</Paragraph>

					<div className={styles['movie-page-actions-container']}>
						<Badge
							icon={<StarIcon aria-label={TEXT_CONSTANTS.A11Y.STAR_ICON} />}
							value={movie.rating}
						/>
						<div className={styles['favorite-button-wrapper']}>
							<FavoriteButton movie={movie} />
						</div>
					</div>

					<MovieDetails movie={movie} fields={MOVIE_DETAILS_FIELDS} />
				</div>
			</div>

			<div className={styles['reviews-section']}>
				<MovieReviews reviews={reviews} />
			</div>
		</div>
	);
};