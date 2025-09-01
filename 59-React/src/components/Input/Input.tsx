import { forwardRef } from 'react';
import { createClassname } from '../../utils/classnameUtils';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  variant?: 'default' | 'error';
  errorMessageId?: string;
  wrapperClassName?: string;
  onEnter?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			icon,
			variant = 'default',
			errorMessageId,
			className,
			wrapperClassName,
			onEnter,
			...props
		},
		ref
	) => {
		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter') {
				onEnter?.();
			}
		};

		const inputClassName = createClassname(
			styles.input,
			{
				[styles['input-with-icon']]: !!icon,
				[styles['input-error']]: variant === 'error'
			},
			className
		);

		return (
			<div className={createClassname(styles['input-wrapper'], wrapperClassName)}>
				<input
					ref={ref}
					className={inputClassName}
					aria-invalid={variant === 'error'}
					aria-errormessage={variant === 'error' ? errorMessageId : undefined}
					onKeyDown={handleKeyDown}
					{...props}
				/>
				{icon && (
					<span className={styles['input-icon']} aria-hidden="true">
						{icon}
					</span>
				)}
			</div>
		);
	}
);