import PropTypes from 'prop-types';
import classNames from 'classnames';

function UserIcon({ className }) {
	return (
		<svg
			className={classNames(className)}
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			stroke="currentColor"
			strokeWidth="1.5"
		>
			<circle cx="12" cy="6" r="4" strokeWidth="1.5" />
			<ellipse cx="12" cy="17" rx="7" ry="4" strokeWidth="1.5" />
		</svg>
	);
}

UserIcon.propTypes = {
	className: PropTypes.string
};

export default UserIcon;