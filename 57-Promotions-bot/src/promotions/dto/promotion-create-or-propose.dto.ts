import { IsString, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { IsEndDateAfterStartDate } from './validators/end-date-after-start-date.validator';
import { IsFutureDate } from './validators/is-future-date.validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionCreateOrProposeDto:
 *       type: object
 *       description: Данные для создания или предложения акции.
 *       required:
 *         - title
 *         - description
 *         - startDate
 *         - endDate
 *       properties:
 *         title:
 *           type: string
 *           description: Название акции.
 *           example: "Скидка 20% на товары"
 *         description:
 *           type: string
 *           description: Описание акции.
 *           example: "Акция на весь ассортимент"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Дата начала акции (ISO 8601). Для предложений должна быть в будущем.
 *           example: "2023-06-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Дата окончания акции (ISO 8601). Должна быть позже даты начала.
 *           example: "2023-06-30T23:59:59Z"
 *         isDeleted:
 *           type: boolean
 *           description: Флаг мягкого удаления.
 *           example: false
 */
export class PromotionCreateOrProposeDto {
	@IsString({ message: MESSAGES.INVALID_TITLE })
	title!: string;

	@IsString({ message: MESSAGES.INVALID_DESCRIPTION })
	description!: string;

	@IsDateString({}, { message: MESSAGES.INVALID_DATE_FORMAT })
	@IsFutureDate()
	startDate!: string;

	@IsDateString({}, { message: MESSAGES.INVALID_DATE_FORMAT })
	@IsEndDateAfterStartDate({ message: MESSAGES.INVALID_DATES })
	endDate!: string;

	@IsBoolean({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Удален') })
	@IsOptional()
	isDeleted?: boolean;
}
