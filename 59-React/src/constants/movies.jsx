import posters from './posters.jsx';

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