import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logoutAccount } from '../store/usersSlice';
import { accountsAdapter } from '../store/usersSlice';

interface UseNavigationReturn {
  handleNavClick: (e: React.MouseEvent | null, href: string, isLogout?: boolean) => void;
  handleNavigate: (href: string, isLogout?: boolean) => void;
  handleLogout: () => void;
  canAccess: (route: string) => boolean;
  toggleDropdown: () => void;
  isDropdownOpen: boolean;
}

const selectAccountsEntities = accountsAdapter.getSelectors<RootState>(
	(state) => state.users.accounts
).selectEntities;

const selectIsAuthenticated = (state: RootState) => {
	const currentAccountId = state.users.currentAccountId;
	return !!currentAccountId && !!selectAccountsEntities(state)[currentAccountId];
};

const PROTECTED_ROUTES = ['/favorites'];

export const useNavigation = (): UseNavigationReturn => {
	const navigate = useNavigate();
	const isAuthenticated = useSelector(selectIsAuthenticated);
	const dispatch = useDispatch<AppDispatch>();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const canAccess = useCallback(
		(route: string) => {
			return !PROTECTED_ROUTES.includes(route) || isAuthenticated;
		},
		[isAuthenticated]
	);

	const handleLogout = useCallback(() => {
		dispatch(logoutAccount());
		navigate('/login');
	}, [navigate, dispatch]);

	const toggleDropdown = useCallback(() => {
		setIsDropdownOpen((prev) => !prev);
	}, []);

	const handleNavigation = useCallback(
		(href: string, isLogout?: boolean, e: React.MouseEvent | null = null) => {
			if (e) {
				e.preventDefault();
			}
			if (isLogout) {
				handleLogout();
			} else if (PROTECTED_ROUTES.includes(href) && !isAuthenticated) {
				navigate(`/login?redirect=${encodeURIComponent(href)}`);
			} else {
				navigate(href);
			}
		},
		[handleLogout, navigate, isAuthenticated]
	);

	const handleNavClick = useCallback(
		(e: React.MouseEvent | null, href: string, isLogout?: boolean) => {
			handleNavigation(href, isLogout, e);
		},
		[handleNavigation]
	);

	const handleNavigate = useCallback(
		(href: string, isLogout?: boolean) => {
			handleNavigation(href, isLogout);
		},
		[handleNavigation]
	);

	return useMemo(
		() => ({
			handleNavClick,
			handleNavigate,
			handleLogout,
			canAccess,
			toggleDropdown,
			isDropdownOpen
		}),
		[handleNavClick, handleNavigate, handleLogout, canAccess, toggleDropdown, isDropdownOpen]
	);
};