import { IsEnum } from 'class-validator';
import { PromotionStatus } from '@prisma/client';
import { MESSAGES } from '../../common/messages';

export class PromotionStatusDto {
	@IsEnum(PromotionStatus, { message: MESSAGES.INVALID_STATUS })
	status!: PromotionStatus;
}