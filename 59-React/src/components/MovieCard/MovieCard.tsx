import { FC } from 'react';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import { ViewsIcon } from '../../assets/icons/ViewsIcon';
import styles from './MovieCard.module.css';
import { useNavigation } from '../../hooks/useNavigation';
import { Badge } from '../Badge/Badge';

interface MovieCardProps {
  id: number;
  title: string;
  imageSrc: string;
  views: number;
  onAddToFavorites: () => void;
  isFavorite: boolean;
}

export const MovieCard: FC<MovieCardProps> = ({
	id,
	title,
	imageSrc,
	views,
	onAddToFavorites,
	isFavorite
}) => {
	const { protectNavigation } = useNavigation();
	const navigate = useNavigate();

	const handleCardClick = () => {
		navigate(`/movie/${id}`);
	};

	const handleFavoriteClick = () => {
		protectNavigation(onAddToFavorites);
	};

	return (
		<div className={classNames(styles['movie-card'])}>
			<div className={classNames(styles['movie-card-content'])}>
				<div className={styles['movie-card-image-wrapper']} onClick={handleCardClick}>
					<img
						src={imageSrc}
						alt={title}
						className={styles['movie-card-image']}
						loading="lazy"
					/>
					<div className={styles['badge-wrapper']}>
						<Badge icon={<ViewsIcon />} value={views} />
					</div>
				</div>

				<div className={classNames(styles['movie-card-details'])}>
					<div className={classNames(styles['movie-card-title'])} onClick={handleCardClick}>
						{title}
					</div>
					<ToggleButton
						isActive={isFavorite}
						onClick={handleFavoriteClick}
						activeText={TEXT_CONSTANTS.MOVIE_CARD.IN_FAVORITES}
						inactiveText={TEXT_CONSTANTS.MOVIE_CARD.ADD_TO_FAVORITES}
					/>
				</div>
			</div>
		</div>
	);
};