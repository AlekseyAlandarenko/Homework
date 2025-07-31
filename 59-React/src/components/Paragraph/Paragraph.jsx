import styles from './Paragraph.module.css';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function Paragraph({ size = 'regular', children, className = '' }) {
	return (
		<p
			className={classNames(
				styles.paragraph,
				styles[`paragraph-${size}`],
				className
			)}
		>
			{children}
		</p>
	);
}

Paragraph.propTypes = {
	size: PropTypes.oneOf(['extra-small', 'regular', 'large']),
	children: PropTypes.node.isRequired,
	className: PropTypes.string
};

export default Paragraph;