import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PageLayout } from './components/PageLayout/PageLayout';
import { GlobalErrorFallback } from './components/GlobalErrorFallback/GlobalErrorFallback';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { movieLoader } from './loaders/movieLoader';
import { lazyComponent } from './utils/lazyUtils';

const routes = {
	search: lazyComponent(() => import('./components/SearchPage/SearchPage'), 'SearchPage'),
	login: lazyComponent(() => import('./components/LoginPage/LoginPage'), 'LoginPage'),
	favorites: lazyComponent(() => import('./components/FavoritesPage/FavoritesPage'), 'FavoritesPage'),
	movie: lazyComponent(() => import('./components/MoviePage/MoviePage'), 'MoviePage')
};

const router = createBrowserRouter([
	{
		path: '/',
		element: <PageLayout />,
		errorElement: <GlobalErrorFallback />,
		children: [
			{ index: true, element: <routes.search /> },
			{ path: 'login', element: <routes.login /> },
			{
				path: 'favorites',
				element: (
					<ProtectedRoute>
						<routes.favorites />
					</ProtectedRoute>
				)
			},
			{
				path: 'movie/:id',
				loader: movieLoader,
				element: <routes.movie />
			}
		]
	}
]);

export default function App() {
	return (
		<Suspense fallback={null}>
			<RouterProvider router={router} />
		</Suspense>
	);
}