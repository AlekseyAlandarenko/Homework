import './MovieCard.css';
import PropTypes from 'prop-types';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import BookmarkIcon from './BookmarkIcon.svg';
import ThumbUpIcon from './ThumbUpIcon.svg';
import ViewsIcon from './ViewsIcon.svg';

function MovieCard({ title, imageSrc, views, onAddToFavorites, isFavorite }) {
  return (
    <div className="movie-card">
      <div className="movie-card-image-wrapper" onClick={onAddToFavorites}>
        <img src={imageSrc} alt={title} className="movie-card-image" loading="lazy" />
        <span className="movie-card-views">
          <Icon src={ViewsIcon} alt="Иконка просмотров" className="movie-card-views-icon" />
          {views}
        </span>
      </div>
      <div className="movie-card-info">
        <div className="movie-card-title">{title}</div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onAddToFavorites();
          }}
          className={`button-favorite button-favorite-movie ${isFavorite ? 'button-favorite-active' : ''}`}
        >
          <Icon
            src={isFavorite ? BookmarkIcon : ThumbUpIcon}
            alt="Избранное"
            className="favorite-icon"
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
  isFavorite: PropTypes.bool.isRequired,
};

export default MovieCard;