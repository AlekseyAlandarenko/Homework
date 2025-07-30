import styles from './Button.module.css';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function Button({ children, onClick, modifiers = [] }) {
	const combinedClassName = classNames(
		styles.button,
		...modifiers
			.filter(Boolean)
			.map((mod) => styles[mod])
	);

	return (
		<button type="button" className={combinedClassName} onClick={onClick}>
			{children}
		</button>
	);
}

Button.propTypes = {
	children: PropTypes.node.isRequired,
	onClick: PropTypes.func.isRequired,
	modifiers: PropTypes.arrayOf(PropTypes.string)
};

export default Button;