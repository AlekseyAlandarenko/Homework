/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionUpdateDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: Обновленная акция
 *         description:
 *           type: string
 *           example: Обновленные условия акции
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: '2023-01-15T00:00:00Z'
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: '2023-02-15T23:59:59Z'
 */
import { IsString, IsDateString, IsOptional } from 'class-validator';
import { IsEndDateAfterStartDate } from './validators/end-date-after-start-date.validator';
import { MESSAGES } from '../../common/messages';

export class PromotionUpdateDto {
  @IsString({ message: MESSAGES.INVALID_TITLE })
  @IsOptional()
  title?: string;

  @IsString({ message: MESSAGES.INVALID_DESCRIPTION })
  @IsOptional()
  description?: string;

  @IsDateString({}, { message: MESSAGES.INVALID_DATE_FORMAT })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: MESSAGES.INVALID_DATE_FORMAT })
  @IsOptional()
  @IsEndDateAfterStartDate({ message: MESSAGES.INVALID_DATES })
  endDate?: string;
}