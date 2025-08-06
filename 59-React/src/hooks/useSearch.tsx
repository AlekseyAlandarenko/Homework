import { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react';
import { MOVIES } from '../constants/movieData';

interface Movie {
  id: number;
  title: string;
  imageSrc: string;
  views: number;
}

interface UseSearchReturn {
  searchQuery: string;
  filteredMovies: Movie[];
  isSearchPerformed: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
}

export function useSearch(): UseSearchReturn {
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [searchTerm, setSearchTerm] = useState<string>('');
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		searchInputRef.current?.focus();
	}, []);

	const handleInputChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(value);
	};

	const handleSearch = () => {
		setSearchTerm(searchQuery.trim());
	};

	const filteredMovies = useMemo(() => {
		const query = searchTerm.toLowerCase();
		return MOVIES.filter((movie) => movie.title.toLowerCase().includes(query));
	}, [searchTerm]);

	return {
		searchQuery,
		filteredMovies,
		isSearchPerformed: !!searchTerm,
		searchInputRef,
		handleInputChange,
		handleSearch
	};
}