import { FC, ReactNode, memo } from 'react';
import { createClassname } from '../../utils/classnameUtils';
import styles from './Title.module.css';

interface TitleProps {
  level?: number;
  children: ReactNode;
  className?: string;
  id?: string;
}

export const Title: FC<TitleProps> = memo(({ level = 1, children, className = '', id }) => {
	const safeLevel = Math.min(Math.max(level, 1), 6);
	const Tag = `h${safeLevel}` as keyof JSX.IntrinsicElements;

	return (
		<Tag className={createClassname(styles.title, styles[`title-h${safeLevel}`], className)} id={id}>
			{children}
		</Tag>
	);
});