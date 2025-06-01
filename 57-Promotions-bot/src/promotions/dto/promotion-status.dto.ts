import { IsIn } from 'class-validator';
import { MESSAGES } from '../../common/messages';
import { PROMOTION_STATUSES, PromotionStatus } from '../../common/constants';

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionStatusDto:
 *       type: object
 *       description: Данные для обновления статуса акции.
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: Статус акции (PENDING — ожидает, APPROVED — утверждена, REJECTED — отклонена).
 *           example: "APPROVED"
 */
export class PromotionStatusDto {
	@IsIn(PROMOTION_STATUSES, { message: MESSAGES.INVALID_STATUS })
	status!: PromotionStatus;
}
