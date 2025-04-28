/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionStatusDto:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           example: APPROVED
 */
import { IsEnum } from 'class-validator';
import { PromotionStatus } from '@prisma/client';
import { MESSAGES } from '../../common/messages';

export class PromotionStatusDto {
  @IsEnum(PromotionStatus, { message: MESSAGES.INVALID_STATUS })
  status!: PromotionStatus;
}