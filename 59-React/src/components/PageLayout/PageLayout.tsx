import { FC, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header/Header';
import { useAuth } from '../../hooks/useAuth';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children?: ReactNode;
}

export const PageLayout: FC<PageLayoutProps> = ({ children }) => {
	const { navLinks, favorites } = useAuth();

	return (
		<div className={styles['page-container']}>
			<Header badgeValue={favorites.length} navLinks={navLinks} />
			<Outlet />
			{children}
		</div>
	);
};