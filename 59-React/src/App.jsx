import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SearchPage from './components/SearchPage/SearchPage';
import LoginPage from './components/LoginPage/LoginPage';
import FavoritesPage from './components/FavoritesPage/FavoritesPage';

function ProtectedRoute({ children }) {
	const { user } = useAuth();
	return user ? children : <Navigate to="/login" />;
}

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<SearchPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route 
						path="/favorites" 
						element={
							<ProtectedRoute>
								<FavoritesPage />
							</ProtectedRoute>
						} 
					/>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}