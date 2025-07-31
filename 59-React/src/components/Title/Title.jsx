import styles from './Title.module.css';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function Title({ level = 1, children, className = '' }) {
	const Tag = `h${level}`;
	return (
		<Tag
			className={classNames(styles.title, styles[`title-h${level}`], className)}
		>
			{children}
		</Tag>
	);
}

Title.propTypes = {
	level: PropTypes.oneOf([1, 2, 3]),
	children: PropTypes.node.isRequired,
	className: PropTypes.string
};

export default Title;