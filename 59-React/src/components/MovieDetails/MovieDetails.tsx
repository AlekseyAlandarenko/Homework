import { FC, useMemo } from 'react';
import { Paragraph } from '../Paragraph/Paragraph';
import styles from './MovieDetails.module.css';
import type { Movie } from '../../interfaces/movie.interface';

export interface Field<MovieType> {
  key: Extract<keyof MovieType, string>;
  label: string;
  format?: (value: unknown) => React.ReactNode;
}

interface MovieDetailItemProps {
  label: string;
  value: React.ReactNode;
}

const MovieDetailItem: FC<MovieDetailItemProps> = ({ label, value }) => (
	<div className={styles['movie-detail']}>
		<Paragraph className={styles['movie-detail-label']}>{label}</Paragraph>
		<Paragraph size="large" className={styles['movie-detail-value']}>
			{value}
		</Paragraph>
	</div>
);

interface MovieDetailsProps {
  movie: Movie;
  fields: readonly Field<Movie>[];
}

export const MovieDetails: FC<MovieDetailsProps> = ({ movie, fields }) => {
	const details = useMemo(
		() =>
			fields.map(({ key, label, format }, idx) => {
				const rawValue = movie[key as keyof Movie];
				const value = format
					? format(rawValue)
					: Array.isArray(rawValue)
						? rawValue.join(', ')
						: String(rawValue ?? 'N/A');

				return <MovieDetailItem key={idx} label={label} value={value} />;
			}),
		[movie, fields]
	);

	return <div className={styles.details}>{details}</div>;
};