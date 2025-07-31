import ProfileIcon from '../assets/icons/ProfileIcon.jsx';
import UserIcon from '../assets/icons/UserIcon.jsx';

export const NAV_LINKS = (isAuthenticated = false, username = '') => {
	const links = [
		{ label: 'Поиск фильмов', href: '/' },
		{ label: 'Мои фильмы', href: '/favorites', hasBadge: true }
	];

	if (isAuthenticated) {
		links.push(
			{ label: username, icon: <UserIcon className="header-link-icon" /> },
			{
				href: '/login',
				label: 'Выйти',
				icon: <ProfileIcon className="header-link-icon" />,
				isLogout: true
			}
		);
	} else {
		links.push({
			href: '/login',
			label: 'Войти',
			icon: <ProfileIcon className="header-link-icon" />
		});
	}

	return links;
};