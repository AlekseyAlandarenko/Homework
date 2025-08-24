import { FC, ReactNode, KeyboardEvent, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './LinkItem.module.css';
import { Paragraph } from '../Paragraph/Paragraph';
import { NavLinkItem } from '../../interfaces/navigation.interface';

interface LinkItemProps {
  link: NavLinkItem;
  onClick: (e: React.MouseEvent | null, href: string, isLogout?: boolean) => void;
  onUsernameClick?: (e: React.MouseEvent) => void;
  children?: ReactNode;
}

export const LinkItem: FC<LinkItemProps> = memo(({ link, onClick, onUsernameClick, children }) => {
	const location = useLocation();
	const mode = new URLSearchParams(location.search).get('mode');

	const isLoginOrRegisterPage = location.pathname === '/login' && (!mode || mode === 'register');

	const isAddProfilePage = location.pathname === '/login' && mode === 'add-profile';

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key !== 'Enter' && e.key !== ' ') return;

		e.preventDefault();
		if (link.href) {
			onClick(null, link.href, link.isLogout);
		} else if (onUsernameClick) {
			onUsernameClick(e as unknown as React.MouseEvent);
		}
	};

	const label = 
	typeof link.label === 'string' ? (
		<Paragraph as="span" weight="bold">
			{link.label}
		</Paragraph>
	) : (
		link.label
	);

	if (link.href) {
		return (
			<NavLink
				to={link.href}
				className={({ isActive }) =>
					[
						styles['header-link'],
						(isActive && link.href !== '/login') || (link.isUserLink && isAddProfilePage)
							? styles['header-link-active']
							: '',
						link.isUserLinkOpen ? styles['header-link-open'] : ''
					]
						.filter(Boolean)
						.join(' ')
				}
				aria-label={typeof link.label === 'string' ? link.label : undefined}
				onClick={(e) => onClick(e, link.href!, link.isLogout)}
				onKeyDown={handleKeyDown}
				role="link"
				tabIndex={0}
			>
				{link.icon}
				{label}
			</NavLink>
		);
	}

	return (
		<div className={styles['header-link-container']}>
			<span
				className={[
					styles['header-link'],
					link.isUserLinkOpen ? styles['header-link-open'] : '',
					(isLoginOrRegisterPage || isAddProfilePage) && link.isUserLink
						? styles['header-link-active']
						: ''
				]
					.filter(Boolean)
					.join(' ')
				}
				onClick={onUsernameClick}
				onKeyDown={handleKeyDown}
				role="button"
				aria-label={typeof link.label === 'string' ? link.label : undefined}
				tabIndex={0}
			>
				{link.icon}
				{label}
			</span>
			{children}
		</div>
	);
});