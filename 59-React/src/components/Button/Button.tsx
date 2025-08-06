import { FC, ReactNode, ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'search' | 'favorite';
  isActive?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: FC<ButtonProps> = ({
	children,
	onClick,
	variant = 'default',
	isActive = false,
	type = 'button'
}) => {
	return (
		<button
			type={type}
			onClick={onClick}
			className={classNames(styles.button, {
				[styles['button-search']]: variant === 'search',
				[styles['button-favorite']]: variant === 'favorite',
				[styles['button-favorite-active']]: isActive
			})}
		>
			{children}
		</button>
	);
};