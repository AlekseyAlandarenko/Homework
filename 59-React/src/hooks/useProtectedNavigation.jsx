import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const useProtectedNavigation = () => {
	const { user } = useAuth();
	const navigate = useNavigate();

	return (action, redirectTo = '/login') => {
		if (!user) {
			navigate(redirectTo);
			return false;
		}
		action();
		return true;
	};
};