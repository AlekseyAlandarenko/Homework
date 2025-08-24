import { FC, ButtonHTMLAttributes, memo } from 'react';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './FavoriteToggle.module.css';
import { BookmarkIcon } from '../../assets/icons/BookmarkIcon';
import { ThumbUpIcon } from '../../assets/icons/ThumbUpIcon';

interface FavoriteToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'isActive'> {
  isActive: boolean;
}

export const FavoriteToggle: FC<FavoriteToggleProps> = memo(({ isActive, ...props }) => {
	return (
		<ToggleButton
			isActive={isActive}
			activeContent={
				<>
					<BookmarkIcon className={styles.icon} />
					{TEXT_CONSTANTS.MOVIE_CARD.IN_FAVORITES}
				</>
			}
			inactiveContent={
				<>
					<ThumbUpIcon className={styles.icon} />
					{TEXT_CONSTANTS.MOVIE_CARD.ADD_TO_FAVORITES}
				</>
			}
			{...props}
		/>
	);
});