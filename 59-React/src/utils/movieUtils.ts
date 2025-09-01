import axios from 'axios';
import { decodeHtml } from './stringUtils';
import { Movie, Review } from '../interfaces/movie.interface';

const TYPE_MAP: Readonly<Record<string, string>> = {
	Movie: 'Фильм',
	TVSeries: 'Сериал',
	TVEpisode: 'Эпизод сериала'
} as const;

export function convertDurationToMinutes(durationString: string): number | null {
	if (!durationString) return null;
	const matches = durationString.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
	if (!matches) return null;
	return (parseInt(matches[1] || '0', 10) * 60) + parseInt(matches[2] || '0', 10);
}

function normalizeReview(review: Review): Review {
	return {
		...review,
		name: decodeHtml(review.name || ''),
		reviewBody: decodeHtml(review.reviewBody || '')
	};
}

export function normalizeReviews(reviewsRaw: Review | Review[] | undefined): Review[] {
	const reviews = Array.isArray(reviewsRaw) ? reviewsRaw : reviewsRaw ? [reviewsRaw] : [];
	return reviews.map(normalizeReview);
}

export async function fetchMovieDetails(id: string): Promise<Movie> {
	const { data } = await axios.get(`https://search.imdbot.workers.dev/?tt=${id}`);
	const movieData = data.short;
	const runtimeMinutes = convertDurationToMinutes(movieData.duration);

	const genres = movieData.genre
		? Array.isArray(movieData.genre) 
			? movieData.genre.join(', ')
			: String(movieData.genre)
		: 'N/A';

	const reviews = normalizeReviews(movieData.review);

	const ratingValue = movieData.aggregateRating?.ratingValue;
	let rating = 0;
  
	if (typeof ratingValue === 'number') {
		rating = ratingValue;
	} else if (typeof ratingValue === 'string') {
		rating = parseFloat(ratingValue);
	}

	const normalizedRating = Math.min(Math.max(isNaN(rating) ? 0 : rating, 0), 10);

	return {
		id: movieData['@id'] || id,
		title: decodeHtml(movieData.name || 'Неизвестный фильм'),
		imageSrc: movieData.image?.trim() || 'https://via.placeholder.com/480x720',
		rating: normalizedRating,
		views: movieData.aggregateRating?.ratingCount || 0,
		releaseDate: movieData.datePublished || 'N/A',
		runtime: runtimeMinutes ? `${runtimeMinutes} мин` : 'N/A',
		genres,
		plot: decodeHtml(movieData.description || 'Нет описания'),
		type: TYPE_MAP[movieData['@type']] || movieData['@type'] || 'N/A',
		reviews
	};
}

interface ImdbotSearchResult {
  '#IMDB_ID': string;
  '#TITLE': string;
  '#IMG_POSTER'?: string;
  '#RANK'?: number;
}

export function mapSearchResultToMovie(item: ImdbotSearchResult): Movie {
	return {
		id: item['#IMDB_ID'],
		title: decodeHtml(item['#TITLE']),
		imageSrc: item['#IMG_POSTER'] || 'https://via.placeholder.com/282x423',
		views: item['#RANK'] || 0,
		rating: 0,
		releaseDate: 'N/A',
		runtime: 'N/A',
		genres: 'N/A',
		plot: 'N/A',
		type: 'N/A',
		reviews: []
	};
}