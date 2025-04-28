/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionCreateOrProposeDto:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - startDate
 *         - endDate
 *       properties:
 *         title:
 *           type: string
 *           example: Скидка 20% на все товары
 *         description:
 *           type: string
 *           example: Акция действует на весь ассортимент
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: '2023-01-01T00:00:00Z'
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: '2023-01-31T23:59:59Z'
 */
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { IsEndDateAfterStartDate } from './validators/end-date-after-start-date.validator';
import { MESSAGES } from '../../common/messages';

export class PromotionCreateOrProposeDto {
  @IsString({ message: MESSAGES.INVALID_TITLE })
  @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Название') })
  title!: string;

  @IsString({ message: MESSAGES.INVALID_DESCRIPTION })
  @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Описание') })
  description!: string;

  @IsDateString({}, { message: MESSAGES.INVALID_DATE_FORMAT })
  @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Дата начала') })
  startDate!: string;

  @IsDateString({}, { message: MESSAGES.INVALID_DATE_FORMAT })
  @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Дата окончания') })
  @IsEndDateAfterStartDate({ message: MESSAGES.INVALID_DATES })
  endDate!: string;
}