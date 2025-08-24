import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header/Header';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import styles from './PageLayout.module.css';

export const PageLayout: FC = () => {
	return (
		<div className={styles['page-container']}>
			<Header />
			<Outlet />
			<ConfirmModal />
		</div>
	);
};