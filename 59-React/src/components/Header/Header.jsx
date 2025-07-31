import styles from './Header.module.css';
import PropTypes from 'prop-types';
import LogoIcon from '../../assets/logos/LogoIcon.svg';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProtectedNavigation } from '../../hooks/useProtectedNavigation.jsx';
import classNames from 'classnames';
import { useState } from 'react';

function Header({ badgeValue = 0, navLinks }) {
	const { exitCurrentUser, login, user, users } = useAuth();
	const navigate = useNavigate();
	const protectNavigation = useProtectedNavigation();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleNavClick = (e, href, isLogout) => {
		e.preventDefault();
		if (isLogout) {
			exitCurrentUser();
			if (users.length > 1) {
				navigate('/');
			} else {
				navigate('/login');
			}
		} else if (href === '/favorites') {
			protectNavigation(() => navigate('/favorites'), '/login');
		} else {
			navigate(href);
		}
	};

	const handleUsernameClick = (e) => {
		e.preventDefault();
		setIsDropdownOpen((prev) => !prev);
	};

	const handleUserSelect = (username) => {
		login(username);
		setIsDropdownOpen(false);
		navigate('/');
	};

	return (
		<header className={styles.header}>
			<div className={styles['header-logo']}>
				<Link to="/" className={styles['header-logo']} aria-label="На главную">
					<img src={LogoIcon} alt="Логотип" />
				</Link>
			</div>
			{navLinks.length > 0 && (
				<nav className={styles['header-nav']}>
					{navLinks.map((link) => (
						<div key={link.label || link.href} className={styles['header-link-wrapper']}>
							{link.href ? (
								<Link
									to={link.href}
									className={styles['header-link']}
									aria-label={link.label}
									onClick={(e) => handleNavClick(e, link.href, link.isLogout)}
								>
									{link.label}
									{link.icon}
								</Link>
							) : (
								<div className={styles['header-link-container']}>
									<span
										className={styles['header-link']}
										onClick={handleUsernameClick}
										aria-label={link.label}
									>
										{link.label}
										{link.icon}
									</span>
									{link.label === user?.username && isDropdownOpen && (
										<div className={styles['dropdown']}>
											{users.map((u) => (
												<button
													key={u.username}
													className={classNames(styles['dropdown-item'], {
														[styles['dropdown-item-active']]: u.username === user.username
													})}
													onClick={() => handleUserSelect(u.username)}
												>
													{u.username}
												</button>
											))}
											<button
												className={styles['dropdown-item']}
												onClick={() => {
													navigate('/login');
													setIsDropdownOpen(false);
												}}
											>
                        Войти
											</button>
										</div>
									)}
								</div>
							)}
							{link.hasBadge && badgeValue > 0 && (
								<span className={styles['header-link-badge']}>{badgeValue}</span>
							)}
						</div>
					))}
				</nav>
			)}
		</header>
	);
}

Header.propTypes = {
	badgeValue: PropTypes.number,
	navLinks: PropTypes.arrayOf(
		PropTypes.shape({
			href: PropTypes.string,
			label: PropTypes.string.isRequired,
			icon: PropTypes.node,
			hasBadge: PropTypes.bool,
			isLogout: PropTypes.bool
		})
	).isRequired
};

Header.defaultProps = {
	badgeValue: 0
};

export default Header;