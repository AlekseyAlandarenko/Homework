import { forwardRef, ReactNode } from 'react';
import classNames from 'classnames';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search' | 'title' | 'error';
  icon?: ReactNode;
  className?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			variant = 'default',
			icon,
			className,
			inputClassName,
			...props
		},
		ref
	) => {
		return (
			<div className={classNames(styles['input-wrapper'], className)}>
				{icon && <span className={styles['input-icon']}>{icon}</span>}
				<input
					ref={ref}
					className={classNames(
						styles.input,
						{
							[styles['input-error']]: variant === 'error',
							[styles['input-with-icon']]: !!icon
						},
						inputClassName
					)}
					aria-invalid={variant === 'error'}
					{...props}
				/>
			</div>
		);
	}
);