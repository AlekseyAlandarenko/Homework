import { FC, memo } from 'react';
import { LazyImage } from '../LazyImage/LazyImage';
import { Badge } from '../Badge/Badge';
import styles from './MovieCardImage.module.css';
import { PLACEHOLDER_CARD } from '../../constants/imageConstants';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import { StarIcon } from '../../assets/icons/StarIcon';

interface MovieCardImageProps {
  imageSrc?: string;
  alt: string;
  views?: number;
  onClick?: () => void;
}

export const MovieCardImage: FC<MovieCardImageProps> = memo(
	({ imageSrc, alt, views = 0, onClick }) => {
		const hasViews = Number.isFinite(views) && views > 0;

		return (
			<button
				type="button"
				className={styles.imageWrapper}
				onClick={onClick}
				aria-label={`Открыть ${alt}`}
			>
				<LazyImage src={imageSrc || PLACEHOLDER_CARD} alt={alt} className={styles.image} />
				{hasViews && (
					<div className={styles.badgeWrapper}>
						<Badge
							icon={<StarIcon aria-label={TEXT_CONSTANTS.A11Y.STAR_ICON} />}
							value={views}
						/>
					</div>
				)}
			</button>
		);
	}
);