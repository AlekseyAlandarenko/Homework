import PropTypes from 'prop-types';
import classNames from 'classnames';

function Icon({ src, alt, className = '' }) {
	return <img src={src} alt={alt} className={classNames(className)} />;
}

Icon.propTypes = {
	src: PropTypes.string.isRequired,
	alt: PropTypes.string.isRequired,
	className: PropTypes.string
};

export default Icon;