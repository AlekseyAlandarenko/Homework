import type { Movie } from './movie.interface';

export interface Profile {
  name: string;
  favorites: Movie[];
}

export interface Account {
  login: string;
  password: string;
  profiles: Profile[];
}