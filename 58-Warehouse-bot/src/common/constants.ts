export const USER_ROLES = ['SUPERADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface PaginationParams {
	page: number;
	limit: number;
}
export const DEFAULT_PAGINATION: PaginationParams = { page: 1, limit: 10 };
