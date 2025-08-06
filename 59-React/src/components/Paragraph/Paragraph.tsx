import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import styles from './Paragraph.module.css';

interface ParagraphProps {
  size?: 'extra-small' | 'regular' | 'large';
  children: ReactNode;
  className?: string;
}

export const Paragraph: FC<ParagraphProps> = ({ size = 'regular', children, className = '' }) => {
	const validSizes = ['extra-small', 'regular', 'large'];
	const safeSize = validSizes.includes(size) ? size : 'regular';

	const paragraphClass = classNames(
		styles.paragraph,
		styles[`paragraph-${safeSize}`],
		className
	);

	return <p className={paragraphClass}>{children}</p>;
};