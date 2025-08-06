import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseNavigationReturn {
  protectNavigation: (action: () => void, redirectTo?: string) => boolean;
  handleNavClick: (e: React.MouseEvent | null, href: string, isLogout?: boolean) => void;
  handleLogout: () => void;
}

export const useNavigation = (): UseNavigationReturn => {
	const { user, logout, users } = useAuth();
	const navigate = useNavigate();

	const protectNavigation = useCallback(
		(action: () => void, redirectTo: string = '/login') => {
			if (!user) {
				navigate(redirectTo);
				return false;
			}
			action();
			return true;
		},
		[user, navigate]
	);

	const handleLogout = useCallback(() => {
		logout();
		navigate(users.length > 0 ? '/' : '/login');
	}, [logout, navigate, users]);

	const handleNavClick = useCallback(
		(e: React.MouseEvent | null, href: string, isLogout?: boolean) => {
			e?.preventDefault();

			if (isLogout) {
				handleLogout();
			} else if (href === '/favorites') {
				protectNavigation(() => navigate(href), '/login');
			} else {
				navigate(href);
			}
		},
		[handleLogout, navigate, protectNavigation]
	);

	return {
		protectNavigation,
		handleNavClick,
		handleLogout
	};
};