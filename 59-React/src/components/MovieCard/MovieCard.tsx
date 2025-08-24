import { FC, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './MovieCard.module.css';
import { MovieCardImage } from '../MovieCardImage/MovieCardImage';
import { makeSelectMovieDetails } from '../../store/moviesSelectors';
import { Paragraph } from '../Paragraph/Paragraph';
import { FavoriteButton } from '../FavoriteButton/FavoriteButton';

interface MovieCardProps {
  id: string;
}

export const MovieCard: FC<MovieCardProps> = memo(({ id }) => {
	const navigate = useNavigate();
	const movieDetails = useSelector(makeSelectMovieDetails(id));

	if (!movieDetails || !movieDetails.movie) return null;

	const { displayTitle, displayImage, displayViews } = movieDetails;

	return (
		<div className={styles['movie-card']}>
			<div className={styles['movie-card-content']}>
				<MovieCardImage
					imageSrc={displayImage}
					alt={TEXT_CONSTANTS.MOVIE_CARD.CARD_IMAGE_ALT}
					views={displayViews}
					onClick={() => navigate(`/movie/${id}`)}
				/>
				<div className={styles['movie-card-details']}>
					<Paragraph
						weight="bold"
						className={styles['movie-card-title']}
						onClick={() => navigate(`/movie/${id}`)}
					>
						{displayTitle}
					</Paragraph>
					<FavoriteButton movie={movieDetails.movie} />
				</div>
			</div>
		</div>
	);
});