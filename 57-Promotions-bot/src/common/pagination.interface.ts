import { PaginationDto } from './dto/pagination.dto';

export type PaginatedResponse<T> = {
	items: T[];
	total: number;
};

export const DEFAULT_PAGINATION: PaginationDto = {
	page: 1,
	limit: 10,
};
