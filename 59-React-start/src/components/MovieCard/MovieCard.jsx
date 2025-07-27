import styles from './MovieCard.module.css';
import PropTypes from 'prop-types';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import BookmarkIcon from './BookmarkIcon.svg';
import ThumbUpIcon from './ThumbUpIcon.svg';
import ViewsIcon from './ViewsIcon.svg';

function MovieCard({ title, imageSrc, views, onAddToFavorites, isFavorite }) {
	return (
		<div className={styles['movie-card']}>
			<div className={styles['movie-card-image-wrapper']}>
				<img
					src={imageSrc}
					alt={title}
					className={styles['movie-card-image']}
					loading="lazy"
				/>
				<span className={styles['movie-card-views']}>
					<Icon
						src={ViewsIcon}
						alt="Иконка просмотров"
						className={styles['movie-card-views-icon']}
					/>
					{views}
				</span>
			</div>
			<div className={styles['movie-card-info']}>
				<div className={styles['movie-card-title']}>{title}</div>
				<Button
					onClick={onAddToFavorites}
					modifiers={[
						'buttonFavorite',
						'buttonFavoriteMovie',
						...(isFavorite ? ['buttonFavoriteActive'] : [])
					]}
				>
					<Icon
						src={isFavorite ? BookmarkIcon : ThumbUpIcon}
						alt="Избранное"
						className={styles['favorite-icon']}
					/>
					{isFavorite ? 'В избранном' : 'В избранное'}
				</Button>
			</div>
		</div>
	);
}

MovieCard.propTypes = {
	title: PropTypes.string.isRequired,
	imageSrc: PropTypes.string.isRequired,
	views: PropTypes.number.isRequired,
	onAddToFavorites: PropTypes.func.isRequired,
	isFavorite: PropTypes.bool.isRequired
};

export default MovieCard;