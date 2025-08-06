import { ReactNode } from 'react';
import { ProfileLoginIcon } from '../assets/icons/ProfileLoginIcon';
import { ProfileLogoutIcon } from '../assets/icons/ProfileLogoutIcon';
import { UserIcon } from '../assets/icons/UserIcon';
import { TEXT_CONSTANTS } from './textConstants';

export interface NavLink {
  href?: string;
  label: string;
  icon?: ReactNode;
  hasBadge?: boolean;
  isLogout?: boolean;
}

export const NAV_LINKS = (
	isAuthenticated: boolean = false,
	username: string = ''
): NavLink[] => {
	const links: NavLink[] = [
		{ label: TEXT_CONSTANTS.HEADER.SEARCH, href: '/' },
		{ label: TEXT_CONSTANTS.HEADER.FAVORITES, href: '/favorites', hasBadge: true }
	];

	if (isAuthenticated) {
		links.push(
			{ label: username, icon: <UserIcon className="header-link-icon" /> },
			{
				href: '/login',
				label: TEXT_CONSTANTS.HEADER.LOGOUT,
				icon: <ProfileLogoutIcon className="header-link-icon" />,
				isLogout: true
			}
		);
	} else {
		links.push({
			href: '/login',
			label: TEXT_CONSTANTS.HEADER.LOGIN,
			icon: <ProfileLoginIcon className="header-link-icon" />
		});
	}

	return links;
};