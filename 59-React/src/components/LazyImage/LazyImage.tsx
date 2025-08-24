import { FC, memo } from 'react';
import { handleImageError } from '../../utils/imageUtils';
import { PLACEHOLDER_CARD } from '../../constants/imageConstants';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  srcSet?: string;
  sizes?: string;
}

export const LazyImage: FC<LazyImageProps> = memo(({ src, alt, className, srcSet, sizes }) => {
	return (
		<img
			src={src}
			alt={alt}
			className={className}
			loading="lazy"
			onError={handleImageError(PLACEHOLDER_CARD)}
			srcSet={srcSet}
			sizes={sizes}
		/>
	);
});