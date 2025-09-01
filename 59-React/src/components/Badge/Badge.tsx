import { FC, ReactNode, memo } from 'react';
import styles from './Badge.module.css';
import { Paragraph } from '../Paragraph/Paragraph';
import { createClassname } from '../../utils/classnameUtils';

interface BadgeProps {
  icon: ReactNode;
  value: number;
  className?: string;
}

export const Badge: FC<BadgeProps> = memo(({ icon, value, className }) => {
	const rootClassName = createClassname(styles.badge, className);

	return (
		<span className={rootClassName}>
			<span className={styles.icon}>{icon}</span>
			<Paragraph as="span">{value}</Paragraph>
		</span>
	);
});