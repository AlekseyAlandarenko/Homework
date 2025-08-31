import { FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigation } from '../../hooks/useNavigation';
import { UserDropdown } from '../UserDropdown/UserDropdown';
import { LinkItem } from '../LinkItem/LinkItem';
import LogoIcon from '../../assets/logos/LogoIcon.svg';
import styles from './Header.module.css';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import {
	selectCurrentAccountId,
	selectCurrentProfileId,
	makeSelectFavoritesCount,
	selectCurrentProfileName
} from '../../store/usersSelectors';
import { RootState } from '../../store/store';
import { Paragraph } from '../Paragraph/Paragraph';
import { UserIcon } from '../../assets/icons/UserIcon';
import { ProfileLogoutIcon } from '../../assets/icons/ProfileLogoutIcon';
import { ProfileLoginIcon } from '../../assets/icons/ProfileLoginIcon';
import { NavLinkItem } from '../../interfaces/navigation.interface';

export const Header: FC = () => {
	const { handleNavClick, toggleDropdown, isDropdownOpen } = useNavigation();

	const currentAccountId = useSelector(selectCurrentAccountId);
	const currentProfileId = useSelector(selectCurrentProfileId);

	const isAuthenticated = currentAccountId !== null && currentAccountId !== undefined;

	const favoritesCount = useSelector((state: RootState) =>
		makeSelectFavoritesCount(currentProfileId ?? undefined)(state)
	);

	const currentProfileName = useSelector(selectCurrentProfileName);

	const logoLink: NavLinkItem = {
		label: <img src={LogoIcon} alt={TEXT_CONSTANTS.HEADER.LOGO_ALT} />,
		href: '/',
		hasBadge: false
	};

	const navLinks: NavLinkItem[] = useMemo(
		() => [
			{ label: TEXT_CONSTANTS.HEADER.SEARCH, href: '/', hasBadge: false },
			{ label: TEXT_CONSTANTS.HEADER.FAVORITES, href: '/favorites', hasBadge: true },
			...(isAuthenticated
				? [
					{
						label: `${currentAccountId} (${currentProfileName})`,
						icon: <UserIcon className="header-link-icon" />,
						hasBadge: false,
						isUserLink: true
					},
					{
						href: '/login',
						label: TEXT_CONSTANTS.HEADER.LOGOUT,
						icon: <ProfileLogoutIcon className="header-link-icon" />,
						isLogout: true,
						hasBadge: false
					}
				]
				: [
					{
						label: TEXT_CONSTANTS.HEADER.LOGIN,
						icon: <ProfileLoginIcon className="header-link-icon" />,
						hasBadge: false,
						isUserLink: true
					}
				])
		],
		[isAuthenticated, currentAccountId, currentProfileName]
	);

	return (
		<header className={styles.header}>
			<div className={styles.logo}>
				<LinkItem link={logoLink} onClick={handleNavClick} />
			</div>

			<nav className={styles['header-nav']}>
				{navLinks.map((link, index) => (
					<div
						key={typeof link.label === 'string' ? link.label : index}
						className={styles['header-link-wrapper']}
					>
						<LinkItem
							link={{ ...link, isUserLinkOpen: link.isUserLink && isDropdownOpen }}
							onClick={handleNavClick}
							onUsernameClick={link.isUserLink ? toggleDropdown : undefined}
						>
							{link.isUserLink && (
								<UserDropdown isOpen={isDropdownOpen} onClose={() => toggleDropdown()} />
							)}
						</LinkItem>

						{link.hasBadge && isAuthenticated && (
							<Paragraph
								size="extra-small"
								weight="bold"
								className={styles['header-link-badge']}
							>
								{favoritesCount}
							</Paragraph>
						)}
					</div>
				))}
			</nav>
		</header>
	);
};