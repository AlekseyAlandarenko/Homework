import { FC, ReactNode, ButtonHTMLAttributes, memo } from 'react';
import classNames from 'classnames';
import styles from './Button.module.css';
import { Paragraph } from '../Paragraph/Paragraph';
import { TEXT_CONSTANTS } from '../../constants/textConstants';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  isLoading?: boolean;
}

export const Button: FC<ButtonProps> = memo(
	({ children, isLoading = false, disabled, className, type = 'button', ...props }) => {
		const isDisabled = disabled || isLoading;

		return (
			<button
				type={type}
				className={classNames(
					styles.button,
					{ [styles['button-disabled']]: isDisabled },
					className
				)}
				disabled={isDisabled}
				{...props}
			>
				<Paragraph as="span">
					{isLoading ? TEXT_CONSTANTS.COMMON.LOADING : children}
				</Paragraph>
			</button>
		);
	}
);