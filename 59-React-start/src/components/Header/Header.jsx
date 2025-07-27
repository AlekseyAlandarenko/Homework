import styles from './Header.module.css';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import LogoIcon from './LogoIcon.svg';
import { NAV_LINKS } from '../../constants.jsx';

function Header({ className = '', badgeValue = 0 }) {
	return (
		<header className={classNames(styles.header, className)}>
			<div className={styles['header-logo']}>
				<img src={LogoIcon} alt="Логотип" />
			</div>
			<nav className={styles['header-nav']}>
				{NAV_LINKS.map((link) => (
					<div key={link.href} className={styles['header-link-wrapper']}>
						<a
							href={link.href}
							className={styles['header-link']}
							aria-label={link.label}
						>
							{link.label}
							{link.icon}
						</a>
						{link.hasBadge && badgeValue > 0 && (
							<span className={styles['header-link-badge']}>{badgeValue}</span>
						)}
					</div>
				))}
			</nav>
		</header>
	);
}

Header.propTypes = {
	className: PropTypes.string,
	badgeValue: PropTypes.number
};

Header.defaultProps = {
	badgeValue: 0
};

export default Header;