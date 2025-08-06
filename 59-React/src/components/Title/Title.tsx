import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import styles from './Title.module.css';

interface TitleProps {
  level?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}

export const Title: FC<TitleProps> = ({ level = 1, children, className = '' }) => {
	const safeLevel = [1, 2, 3].includes(level) ? level : 1;
	const Tag = `h${safeLevel}` as keyof JSX.IntrinsicElements;

	const titleClass = classNames(
		styles.title,
		styles[`title-h${safeLevel}`],
		className
	);

	return <Tag className={titleClass}>{children}</Tag>;
};