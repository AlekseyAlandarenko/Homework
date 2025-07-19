export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}
