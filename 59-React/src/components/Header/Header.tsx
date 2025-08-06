import { FC, useState, MouseEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import LogoIcon from '../../assets/logos/LogoIcon.svg';
import styles from './Header.module.css';
import classNames from 'classnames';

interface NavLinkItem {
  href?: string;
  label: string;
  icon?: React.ReactNode;
  hasBadge?: boolean;
  isLogout?: boolean;
}

interface HeaderProps {
  badgeValue?: number;
  navLinks: NavLinkItem[];
}

const LinkItem: FC<{ link: NavLinkItem; onClick: (e: MouseEvent, href: string, isLogout?: boolean) => void }> = ({ link, onClick }) => {
	const { href, label, icon, isLogout } = link;

	const handleClick = (e: MouseEvent) => {
		onClick(e, href!, isLogout);
	};

	return (
		<NavLink
			to={href!}
			className={({ isActive }) => classNames(styles['header-link'], { [styles['header-link-active']]: isActive })}
			aria-label={label}
			onClick={handleClick}
		>
			{label}
			{icon}
		</NavLink>
	);
};

export const Header: FC<HeaderProps> = ({ badgeValue = 0, navLinks = [] }) => {
	const { user } = useAuth();
	const { handleNavClick } = useNavigation();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleUsernameClick = (e: MouseEvent) => {
		e.preventDefault();
		setIsDropdownOpen((prev) => !prev);
	};

	const renderNavLink = (link: NavLinkItem) => {
		const isUserLink = link.label === user?.username;

		if (link.href) {
			return (
				<LinkItem
					link={link}
					onClick={handleNavClick}
				/>
			);
		}

		return (
			<div className={styles['header-link-container']}>
				<span
					className={classNames(styles['header-link'], {
						[styles['header-link-open']]: isDropdownOpen && isUserLink
					})}
					onClick={handleUsernameClick}
				>
					{link.label}
					{link.icon}
				</span>
				{isUserLink && (
					<UserDropdown
						isOpen={isDropdownOpen}
						onClose={() => setIsDropdownOpen(false)}
					/>
				)}
			</div>
		);
	};

	const renderBadge = (hasBadge?: boolean) => {
		if (!hasBadge || badgeValue <= 0) return null;
		return <span className={styles['header-link-badge']}>{badgeValue}</span>;
	};

	return (
		<header className={styles.header}>
			<div>
				<NavLink to="/" aria-label="На главную">
					<img src={LogoIcon} alt="Логотип" />
				</NavLink>
			</div>
			{navLinks.length > 0 && (
				<nav className={styles['header-nav']}>
					{navLinks.map((link) => (
						<div key={link.label || link.href} className={styles['header-link-wrapper']}>
							{renderNavLink(link)}
							{renderBadge(link.hasBadge)}
						</div>
					))}
				</nav>
			)}
		</header>
	);
};