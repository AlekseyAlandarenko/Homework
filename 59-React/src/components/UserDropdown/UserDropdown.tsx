import { FC, useCallback } from 'react';
import classNames from 'classnames';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './UserDropdown.module.css';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserDropdown: FC<UserDropdownProps> = ({ isOpen, onClose }) => {
	const { users, user, setCurrentUser } = useAuth();
	const { handleNavClick } = useNavigation();

	const handleUserSelect = useCallback(
		(username: string) => {
			setCurrentUser(username);
			onClose();
		},
		[setCurrentUser, onClose]
	);

	const handleLoginRedirect = useCallback(() => {
		handleNavClick(null, '/login');
		onClose();
	}, [handleNavClick, onClose]);

	if (!isOpen) return null;

	const renderUserItem = (u: { username: string }) => {
		const isActive = u.username === user?.username;
		const itemClass = classNames(styles['dropdown-item'], {
			[styles['dropdown-item-active']]: isActive
		});

		return (
			<button
				key={u.username}
				className={itemClass}
				onClick={() => handleUserSelect(u.username)}
			>
				{u.username}
			</button>
		);
	};

	return (
		<div className={styles.dropdown}>
			{users.map(renderUserItem)}
			<button
				className={styles['dropdown-item']}
				onClick={handleLoginRedirect}
			>
				{TEXT_CONSTANTS.HEADER.LOGIN}
			</button>
		</div>
	);
};