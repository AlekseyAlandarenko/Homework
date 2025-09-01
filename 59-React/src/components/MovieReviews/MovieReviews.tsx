import { FC, useMemo } from 'react';
import { Paragraph } from '../Paragraph/Paragraph';
import styles from './MovieReviews.module.css';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import type { Movie, Review } from '../../interfaces/movie.interface';

interface MovieReviewsProps {
  reviews: Movie['reviews'];
}

type ReviewTextVariant = 'title' | 'date' | 'body';

const ReviewText: FC<{ variant: ReviewTextVariant; children: React.ReactNode }> = ({
	variant,
	children
}) => {
	const variantMap: Record<ReviewTextVariant, Partial<React.ComponentProps<typeof Paragraph>>> = {
		title: {
			size: 'large',
			weight: 'extra-bold',
			className: styles['review-title']
		},
		date: {
			className: styles['review-date']
		},
		body: {
			size: 'large',
			className: styles['review-body']
		}
	};

	return <Paragraph {...variantMap[variant]}>{children}</Paragraph>;
};

const ReviewItem: FC<{ review: Review }> = ({ review }) => (
	<article className={styles['review-item']}>
		<header className={styles['review-header']}>
			<ReviewText variant="title">{review.name}</ReviewText>
			<ReviewText variant="date">{review.dateCreated}</ReviewText>
		</header>
		<ReviewText variant="body">{review.reviewBody}</ReviewText>
	</article>
);

export const MovieReviews: FC<MovieReviewsProps> = ({ reviews = [] }) => {
	const hasReviews = reviews.length > 0;

	const reviewItems = useMemo(
		() =>
			reviews.map((review, index) => (
				<ReviewItem key={index} review={review} />
			)),
		[reviews]
	);

	return (
		<section className={styles['reviews-section']}>
			<Paragraph className={styles['reviews-title']}>
				{TEXT_CONSTANTS.MOVIE_PAGE.REVIEWS_TITLE}
			</Paragraph>

			{hasReviews ? (
				<div className={styles['reviews-list']}>{reviewItems}</div>
			) : (
				<Paragraph size="large" weight="normal" className={styles['no-reviews']}>
					{TEXT_CONSTANTS.MOVIE_PAGE.NO_REVIEWS}
				</Paragraph>
			)}
		</section>
	);
};