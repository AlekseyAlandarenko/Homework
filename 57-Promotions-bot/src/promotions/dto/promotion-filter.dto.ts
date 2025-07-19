import { IsIn, IsOptional, IsBoolean, IsArray, IsInt, Min, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { MESSAGES } from '../../common/messages';
import { PROMOTION_STATUSES } from '../../common/constants';
import { PromotionStatus } from '../../common/enums/promotion-status.enum';

export class PromotionsFilterDto {
	@IsIn(PROMOTION_STATUSES, { message: MESSAGES.STATUS_INVALID_FORMAT })
	@IsOptional()
	status?: PromotionStatus;

	@IsBoolean({ message: MESSAGES.ACTIVE_INVALID_BOOLEAN })
	@IsOptional()
	active?: boolean;

	@IsInt({ message: MESSAGES.CITY_ID_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.CITY_ID_INVALID_INTEGER })
	@IsOptional()
	cityId?: number;

	@Transform(({ value }) => {
		if (typeof value === 'string') {
			return value
				.split(',')
				.map(Number)
				.filter((id) => !isNaN(id) && id >= 1);
		}
		return value;
	})
	@IsArray({ message: MESSAGES.CATEGORY_IDS_INVALID_FORMAT })
	@IsInt({ each: true, message: MESSAGES.CATEGORY_IDS_INVALID_INTEGER })
	@Min(1, { each: true, message: MESSAGES.CATEGORY_IDS_INVALID_INTEGER })
	@ArrayMaxSize(50, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE })
	@IsOptional()
	categoryIds?: number[];

	@IsIn(['createdAt', 'title', 'startDate', 'endDate', 'status'], {
		message: MESSAGES.SORT_BY_INVALID_FORMAT,
	})
	@IsOptional()
	sortBy?: string;

	@IsIn(['asc', 'desc'], {
		message: MESSAGES.SORT_ORDER_INVALID_FORMAT,
	})
	@IsOptional()
	sortOrder?: string;
}
