import { IsIn } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { PROMOTION_STATUSES } from '../../common/constants';
import { PromotionStatus } from '../../common/enums/promotion-status.enum';

export class PromotionStatusDto {
	@IsIn(PROMOTION_STATUSES, { message: MESSAGES.STATUS_INVALID_FORMAT })
	status!: PromotionStatus;
}
