import { FC, ButtonHTMLAttributes, memo } from 'react';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './FavoriteToggle.module.css';
import { BookmarkIcon } from '../../assets/icons/BookmarkIcon';
import { ThumbUpIcon } from '../../assets/icons/ThumbUpIcon';

const ActiveFavoriteContent: FC = () => (
	<>
		<BookmarkIcon className={styles.icon} />
		{TEXT_CONSTANTS.MOVIE_CARD.IN_FAVORITES}
	</>
);

const InactiveFavoriteContent: FC = () => (
	<>
		<ThumbUpIcon className={styles.icon} />
		{TEXT_CONSTANTS.MOVIE_CARD.ADD_TO_FAVORITES}
	</>
);

interface FavoriteToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'isActive'> {
  isActive: boolean;
}

export const FavoriteToggle: FC<FavoriteToggleProps> = memo(({ isActive, ...props }) => {
	return (
		<ToggleButton
			isActive={isActive}
			activeContent={<ActiveFavoriteContent />}
			inactiveContent={<InactiveFavoriteContent />}
			{...props}
		/>
	);
});