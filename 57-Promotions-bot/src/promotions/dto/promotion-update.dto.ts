import { IsString, IsDateString, IsOptional, Validate, IsBoolean } from 'class-validator';
import { IsEndDateAfterStartDate } from './validators/end-date-after-start-date.validator';
import { NonEmptyObjectValidator } from './validators/non-empty-object.validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionUpdateDto:
 *       type: object
 *       description: Данные для обновления акции. Требуется хотя бы одно поле.
 *       properties:
 *         title:
 *           type: string
 *           description: Название акции.
 *           example: Обновленная акция.
 *         description:
 *           type: string
 *           description: Описание акции.
 *           example: Новые условия акции.
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Дата начала акции (ISO 8601).
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

	@IsBoolean({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Удален') })
	@IsOptional()
	isDeleted?: boolean;

	@Validate(NonEmptyObjectValidator, [{ validateDates: true }], {
		message: MESSAGES.VALIDATION_FAILED,
	})
	private nonEmptyValidation?: boolean;
}
