import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { SearchPage } from './components/SearchPage/SearchPage';
import { LoginPage } from './components/LoginPage/LoginPage';
import { FavoritesPage } from './components/FavoritesPage/FavoritesPage';
import { MoviePage } from './components/MoviePage/MoviePage';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { PageLayout } from './components/PageLayout/PageLayout';

export default function App(): JSX.Element {
	return (
		<AuthProvider>
			<BrowserRouter>
				<PageLayout>
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
						<Route path="/movie/:id" element={<MoviePage />} />
					</Routes>
				</PageLayout>
			</BrowserRouter>
		</AuthProvider>
	);
}