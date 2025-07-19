import { ProductStatus } from './enums/product-status.enum';
import { Role } from './enums/role.enum';

export const PRODUCT_STATUSES = [
	ProductStatus.AVAILABLE,
	ProductStatus.OUT_OF_STOCK,
	ProductStatus.DISCONTINUED,
] as const;

export const ADMIN_ROLES: readonly Role[] = [Role.SUPERADMIN, Role.ADMIN] as const;
export const FULL_ACCESS_ROLES: readonly Role[] = [
	Role.SUPERADMIN,
	Role.ADMIN,
	Role.WAREHOUSE_MANAGER,
] as const;

export interface PaginationParams {
	page: number;
	limit: number;
}
export const DEFAULT_PAGINATION: PaginationParams = { page: 1, limit: 10 };
