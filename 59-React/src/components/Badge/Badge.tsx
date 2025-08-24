import { FC, ReactNode, memo } from 'react';
import styles from './Badge.module.css';
import { Paragraph } from '../Paragraph/Paragraph';

interface BadgeProps {
  icon: ReactNode;
  value: number;
  className?: string;
}

export const Badge: FC<BadgeProps> = memo(({ icon, value, className }) => {
	const rootClassName = [styles.badge, className].filter(Boolean).join(' ');

	return (
		<span className={rootClassName}>
			<span className={styles.icon}>{icon}</span>
			<Paragraph as="span">{value}</Paragraph>
		</span>
	);
});