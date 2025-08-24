import { FC, useEffect, useRef, ReactNode, useCallback } from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '../../hooks/useNavigation';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './UserDropdown.module.css';
import { switchProfile } from '../../store/usersSlice';
import { RootState } from '../../store/store';
import { makeSelectProfilesForAccount } from '../../store/usersSelectors';
import { accountsAdapter, profilesAdapter } from '../../store/usersSlice';
import { showDeleteAccountModal, showRemoveProfileModal } from '../../utils/modalUtils';

interface DropdownItemProps {
  children: ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isLast?: boolean;
}

const DropdownItem: FC<DropdownItemProps> = ({ children, onClick, isActive = false, isLast = false }) => (
	<button
		className={classNames(styles['dropdown-item'], {
			[styles['dropdown-item-active']]: isActive,
			[styles['dropdown-item-last']]: isLast
		})}
		onClick={onClick}
	>
		{children}
	</button>
);

export const UserDropdown: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
	const dispatch = useDispatch();
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { handleNavigate } = useNavigation();

	useEffect(() => {
		const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleOutsideClick);
			document.addEventListener('touchstart', handleOutsideClick);
		}

		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
			document.removeEventListener('touchstart', handleOutsideClick);
		};
	}, [isOpen, onClose]);

	const account = useSelector((state: RootState) =>
		state.users.currentAccountId
			? accountsAdapter.getSelectors().selectById(state.users.accounts, state.users.currentAccountId)
			: null
	);

	const profile = useSelector((state: RootState) =>
		state.users.currentProfileId
			? profilesAdapter.getSelectors().selectById(state.users.profiles, state.users.currentProfileId)
			: null
	);

	const selectProfilesForAccount = makeSelectProfilesForAccount(account?.login);
	const profiles = useSelector(selectProfilesForAccount);

	const handleProfileSwitch = useCallback(
		(profileName: string) => {
			if (!account) return;
			dispatch(switchProfile({ account: account.login, profile: profileName }));
			onClose();
		},
		[dispatch, onClose, account]
	);

	const handleAddProfile = useCallback(() => {
		handleNavigate('/login?mode=add-profile');
		onClose();
	}, [handleNavigate, onClose]);

	const handleRegister = useCallback(() => {
		handleNavigate('/login?mode=register');
		onClose();
	}, [handleNavigate, onClose]);

	const handleLogin = useCallback(() => {
		handleNavigate('/login');
		onClose();
	}, [handleNavigate, onClose]);

	if (!isOpen) return null;

	if (!account || !profile) {
		return (
			<div className={styles.dropdown} ref={dropdownRef}>
				<DropdownItem onClick={handleRegister}>{TEXT_CONSTANTS.HEADER.REGISTER}</DropdownItem>
				<DropdownItem onClick={handleLogin} isLast>
					{TEXT_CONSTANTS.HEADER.AUTH}
				</DropdownItem>
			</div>
		);
	}

	const isMainProfile = profile.name === TEXT_CONSTANTS.COMMON.MAIN_PROFILE_NAME;
	const canRemoveProfile = Boolean(profiles?.length && profiles.length > 1 && !isMainProfile);

	return (
		<div className={styles.dropdown} ref={dropdownRef}>
			{profiles.map((p) => (
				<DropdownItem
					key={`${account.login}_${p.name}`}
					isActive={p.name === profile.name}
					onClick={() => handleProfileSwitch(p.name)}
				>
					{p.name}
				</DropdownItem>
			))}

			<DropdownItem onClick={handleAddProfile}>{TEXT_CONSTANTS.HEADER.ADD_PROFILE}</DropdownItem>

			{canRemoveProfile && (
				<DropdownItem
					onClick={() => showRemoveProfileModal(dispatch, account.login, profile.name)}
				>
					{TEXT_CONSTANTS.HEADER.REMOVE_PROFILE}
				</DropdownItem>
			)}

			<DropdownItem
				onClick={() => showDeleteAccountModal(dispatch, account.login)}
				isLast
			>
				{TEXT_CONSTANTS.HEADER.DELETE_ACCOUNT}
			</DropdownItem>
		</div>
	);
};