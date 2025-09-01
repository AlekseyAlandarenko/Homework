import { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../store/usersSelectors';

export const ProtectedRoute: FC<{ children: ReactNode }> = ({ children }) => {
	const isAuthenticated = useSelector(selectIsAuthenticated);
	const location = useLocation();

	if (!isAuthenticated) {
		return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
	}

	return children;
};