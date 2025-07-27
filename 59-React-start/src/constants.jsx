import ProfileIcon from './components/Header/ProfileIcon.jsx';
import posters from './components/MovieCard/posters.jsx';

export const NAV_LINKS = [
	{ href: '#home', label: 'Главная' },
	{ href: '#favorites', label: 'Избранное', hasBadge: true },
	{
		href: '#profile',
		label: 'Профиль',
		icon: <ProfileIcon className="header-link-icon" />
	}
];

export const MOVIES = [
	'Black Widow',
	'Shang Chi',
	'Loki',
	'How I Met Your Mother',
	'Money Heist',
	'Friends',
	'The Big Bang Theory',
	'Two And a Half Men'
].map((title, i) => ({
	id: i,
	title,
	imageSrc: posters[i],
	views: 1000 + i * 123
}));