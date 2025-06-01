export const PROMOTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export const USER_ROLES = ['SUPERADMIN', 'ADMIN', 'SUPPLIER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface PaginationParams {
	page: number;
	limit: number;
}
export const DEFAULT_PAGINATION: PaginationParams = { page: 1, limit: 10 };
