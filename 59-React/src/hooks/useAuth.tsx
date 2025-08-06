import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink } from '../constants/navLinks';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  setCurrentUser: (username: string) => void;
  logout: () => void;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  navLinks: NavLink[];
}

export function useAuth(): AuthContextType {
	return useContext(AuthContext) as AuthContextType;
}