import { FC, ReactNode, memo } from 'react';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import styles from './InputButtonRow.module.css';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import { Paragraph } from '../Paragraph/Paragraph';
import classNames from 'classnames';

export interface InputButtonRowProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  variant?: 'default' | 'error';
  name: string;
  type?: string;
  error?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  buttonType?: 'button' | 'submit';
  disabled?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  ariaLabel?: string;
}

export const InputButtonRow: FC<InputButtonRowProps> = memo(
	({
		value,
		onChange,
		placeholder,
		variant = 'default',
		name,
		type = 'text',
		error,
		buttonText,
		onButtonClick,
		buttonType = 'submit',
		disabled = false,
		isLoading = false,
		icon,
		ariaLabel
	}) => {
		const inputVariant = error ? 'error' : variant;
		const errorMessageId = error ? `error-${name}` : undefined;

		return (
			<div className={styles.container}>
				<div className={styles['input-button-container']}>
					<Input
						value={value}
						onChange={onChange}
						placeholder={placeholder}
						variant={inputVariant}
						className={styles.input}
						name={name}
						type={type}
						icon={icon}
						errorMessageId={errorMessageId}
						disabled={disabled}
						aria-label={ariaLabel}
					/>

					{buttonText && (
						<Button
							type={buttonType}
							className={styles.button}
							onClick={onButtonClick}
							disabled={disabled || isLoading}
							aria-label={buttonText}
						>
							{isLoading ? TEXT_CONSTANTS.COMMON.LOADING : buttonText}
						</Button>
					)}
				</div>

				{error && (
					<Paragraph
						className={classNames(styles.error, styles[`error-${name}`])}
						id={errorMessageId}
						aria-live="polite"
					>
						{error}
					</Paragraph>
				)}
			</div>
		);
	}
);