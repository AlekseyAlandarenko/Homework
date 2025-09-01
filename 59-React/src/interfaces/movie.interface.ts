export interface Review {
  author: { name: string };
  dateCreated: string;
  name: string;
  reviewBody: string;
  reviewRating: { ratingValue: number };
}

export interface Movie {
  id: string;
  title: string;
  imageSrc?: string;
  rating: number;
  releaseDate: string;
  runtime: string;
  genres: string;
  plot: string;
  views: number;
  type: string;
  reviews: Review[];
}