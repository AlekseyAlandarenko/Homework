import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Input.module.css';
import classNames from 'classnames';

const Input = forwardRef(function Input(
	{
		isValid,
		appearance = 'text',
		icon = null,
		className = '',
		inputClassName = '',
		...props
	},
	ref
) {
	const inputClasses = classNames(
		styles.input,
		appearance && styles[`input-${appearance}`],
		icon && styles['input-with-icon'],
		isValid === false && styles['input-invalid'],
		inputClassName
	);

	return (
		<div className={classNames(styles['input-wrapper'], className)}>
			{icon && <span className={styles['input-icon']}>{icon}</span>}
			<input
				ref={ref}
				className={inputClasses}
				aria-invalid={isValid === false}
				{...props}
			/>
		</div>
	);
});

Input.propTypes = {
	isValid: PropTypes.bool,
	appearance: PropTypes.oneOf(['text', 'title']),
	icon: PropTypes.node,
	className: PropTypes.string,
	inputClassName: PropTypes.string
};

export default Input;