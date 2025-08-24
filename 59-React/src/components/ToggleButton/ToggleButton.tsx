import { FC, memo } from 'react';
import { Button } from '../Button/Button';
import { Paragraph } from '../Paragraph/Paragraph';
import classNames from 'classnames';
import styles from './ToggleButton.module.css';

interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  activeContent: React.ReactNode;
  inactiveContent: React.ReactNode;
  className?: string;
}

export const ToggleButton: FC<ToggleButtonProps> = memo(
	({ isActive, activeContent, inactiveContent, className, ...props }) => {
		return (
			<Button
				className={classNames(
					styles['toggle-wrapper'],
					className,
					isActive ? styles.active : styles.inactive
				)}
				aria-pressed={isActive}
				{...props}
			>
				<Paragraph
					as="span"
					weight="bold"
					className={classNames(styles.state, { [styles.visible]: isActive })}
					aria-hidden={!isActive}
				>
					{activeContent}
				</Paragraph>

				<Paragraph
					as="span"
					weight="bold"
					className={classNames(styles.state, { [styles.visible]: !isActive })}
					aria-hidden={isActive}
				>
					{inactiveContent}
				</Paragraph>
			</Button>
		);
	}
);