import Poster1 from '../assets/posters/poster1.png';
import Poster2 from '../assets/posters/poster2.png';
import Poster3 from '../assets/posters/poster3.png';
import Poster4 from '../assets/posters/poster4.png';
import Poster5 from '../assets/posters/poster5.png';
import Poster6 from '../assets/posters/poster6.png';
import Poster7 from '../assets/posters/poster7.png';
import Poster8 from '../assets/posters/poster8.png';

interface Movie {
  id: number;
  title: string;
  imageSrc: string;
  views: number;
}

export const MOVIES: Movie[] = [
	{
		id: 0,
		title: 'Black Widow',
		imageSrc: Poster1,
		views: 324
	},
	{
		id: 1,
		title: 'Shang Chi',
		imageSrc: Poster2,
		views: 124
	},
	{
		id: 2,
		title: 'Loki',
		imageSrc: Poster3,
		views: 235
	},
	{
		id: 3,
		title: 'How I Met Your Mother',
		imageSrc: Poster4,
		views: 123
	},
	{
		id: 4,
		title: 'Money Heist',
		imageSrc: Poster5,
		views: 8125
	},
	{
		id: 5,
		title: 'Friends',
		imageSrc: Poster6,
		views: 123
	},
	{
		id: 6,
		title: 'The Big Bang Theory',
		imageSrc: Poster7,
		views: 12
	},
	{
		id: 7,
		title: 'Two And a Half Men',
		imageSrc: Poster8,
		views: 456
	}
];