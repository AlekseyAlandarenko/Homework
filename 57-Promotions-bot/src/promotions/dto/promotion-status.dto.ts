import { IsIn } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { PROMOTION_STATUSES } from '../../common/constants';
import { PromotionStatus } from '../../common/enums/promotion-status.enum';

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionStatusDto:
 *       type: object
 *       description: DTO для обновления статуса акции.
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: Новый статус акции (PENDING — на рассмотрении, APPROVED — утверждена, REJECTED — отклонена).
 *           example: APPROVED
 *       required:
 *         - status
 */
export class PromotionStatusDto {
	@IsIn(PROMOTION_STATUSES, { message: MESSAGES.STATUS_INVALID_FORMAT })
	status!: PromotionStatus;
}
