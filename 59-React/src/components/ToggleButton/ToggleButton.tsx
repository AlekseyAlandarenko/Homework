import { FC } from 'react';
import classNames from 'classnames';
import { Button } from '../Button/Button';
import { BookmarkIcon } from '../../assets/icons/BookmarkIcon';
import { ThumbUpIcon } from '../../assets/icons//ThumbUpIcon';
import styles from './ToggleButton.module.css';

interface ToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
  activeText: string;
  inactiveText: string;
  className?: string;
  iconWrapperClass?: string;
  iconClass?: string;
  variant?: 'default' | 'search' | 'favorite';
}

export const ToggleButton: FC<ToggleButtonProps> = ({
	isActive,
	onClick,
	activeText,
	inactiveText,
	className,
	iconWrapperClass,
	iconClass,
	variant = 'favorite'
}) => (
	<Button variant={variant} isActive={isActive} onClick={onClick}>
		<span className={classNames(styles['toggle-button-content'], className)}>
			<span
				className={classNames(styles['state-container'], {
					[styles['visible']]: isActive,
					[styles['hidden']]: !isActive
				})}
			>
				<span className={classNames(styles['icon-wrapper'], iconWrapperClass)}>
					<BookmarkIcon
						stroke="var(--color-button-favorite-active)"
						className={classNames(styles['icon'], iconClass)}
					/>
				</span>
				{activeText}
			</span>
			<span
				className={classNames(styles['state-container'], {
					[styles['visible']]: !isActive,
					[styles['hidden']]: isActive
				})}
			>
				<span className={classNames(styles['icon-wrapper'], iconWrapperClass)}>
					<ThumbUpIcon
						stroke="var(--color-accent)"
						className={classNames(styles['icon'], iconClass)}
					/>
				</span>
				{inactiveText}
			</span>
		</span>
	</Button>
);