import styles from './MovieCard.module.css';
import PropTypes from 'prop-types';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import BookmarkIcon from '../../assets/icons/BookmarkIcon.svg';
import ThumbUpIcon from '../../assets/icons/ThumbUpIcon.svg';
import ViewsIcon from '../../assets/icons/ViewsIcon.svg';
import { useProtectedNavigation } from '../../hooks/useProtectedNavigation.jsx';
import classNames from 'classnames';
import { useCallback } from 'react';

function MovieCard({ title, imageSrc, views, onAddToFavorites, isFavorite }) {
	const protectNavigation = useProtectedNavigation();

	const handleClick = useCallback(() => {
		protectNavigation(onAddToFavorites);
	}, [protectNavigation, onAddToFavorites]);

	return (
		<div className={classNames('flex flex-column align-center', styles['movie-card'])}>
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
			<div className={classNames('flex flex-column', styles['movie-card-info'])}>
				<div className={classNames('text-base', styles['movie-card-title'])}>{title}</div>
				<Button
					onClick={handleClick}
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