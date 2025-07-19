import { PromotionStatus } from './enums/promotion-status.enum';
import { Role } from './enums/role.enum';

export const PROMOTION_STATUSES = [
	PromotionStatus.PENDING,
	PromotionStatus.APPROVED,
	PromotionStatus.REJECTED,
] as const;

export const ADMIN_ROLES: readonly Role[] = [Role.SUPERADMIN, Role.ADMIN] as const;
export const FULL_ACCESS_ROLES: readonly Role[] = [
	Role.SUPERADMIN,
	Role.ADMIN,
	Role.SUPPLIER,
] as const;

export interface PaginationParams {
	page: number;
	limit: number;
}
export const DEFAULT_PAGINATION: PaginationParams = { page: 1, limit: 10 };
