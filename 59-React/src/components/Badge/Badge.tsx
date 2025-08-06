import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import styles from './Badge.module.css';

interface BadgeProps {
  icon: ReactNode;
  value: string | number;
  className?: string;
}

export const Badge: FC<BadgeProps> = ({ icon, value, className }) => {
	return (
		<span className={classNames(styles.badge, className)}>
			<span className={styles.icon}>{icon}</span>
			{value}
		</span>
	);
};