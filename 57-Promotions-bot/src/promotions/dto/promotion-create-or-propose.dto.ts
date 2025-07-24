import {
	IsString,
	IsNotEmpty,
	IsDateString,
	IsOptional,
	MaxLength,
	IsArray,
	IsInt,
	Min,
	ArrayMinSize,
	ArrayMaxSize,
	IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsEndDateAfterStartDate } from './validators/end-date-after-start-date.validator';
import { IsFutureDate } from './validators/is-future-date.validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionCreateOrProposeDto:
 *       type: object
 *       description: DTO для создания или предложения акции.
 *       properties:
 *         title:
 *           type: string
 *           description: Название акции (уникальное, максимум 200 символов).
 *           example: Летняя распродажа 2023
 *           maxLength: 200
 *         description:
 *           type: string
 *           description: Описание акции (максимум 1000 символов).
 *           example: Скидка на летнюю коллекцию
 *           maxLength: 1000
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Дата начала акции (ISO 8601). Должна быть в будущем для предложений поставщиками.
 *           example: 2023-06-01T00:00:00Z
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Дата окончания акции (ISO 8601). Должна быть позже даты начала.
 *           example: 2023-06-30T23:59:59Z
 *         cityId:
 *           type: integer
 *           nullable: true
 *           description: Идентификатор города, связанного с акцией. Может быть null.
 *           example: 1
 *         categoryIds:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 1
 *           description: Идентификаторы категорий акции (от 1 до 50 элементов).
 *           example: [1, 2]
 *         supplierId:
 *           type: integer
 *           nullable: true
 *           description: Идентификатор поставщика (обязателен для администраторов, опционален для поставщиков).
 *           example: 5
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           description: URL изображения акции.
 *           example: "https://example.com/promo.jpg"
 *         linkUrl:
 *           type: string
 *           nullable: true
 *           description: URL ссылки на акцию.
 *           example: "https://example.com/promo"
 *         publicationDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Дата публикации акции (ISO 8601).
 *           example: "2023-06-01T12:00:00Z"
 *       required:
 *         - title
 *         - description
 *         - startDate
 *         - endDate
 */
export class PromotionCreateOrProposeDto {
	@IsString({ message: MESSAGES.TITLE_INVALID_FORMAT })
	@MaxLength(200, { message: MESSAGES.TITLE_INVALID_LENGTH })
	@IsNotEmpty({ message: MESSAGES.TITLE_REQUIRED_FIELD })
	title!: string;

	@IsString({ message: MESSAGES.DESCRIPTION_INVALID_FORMAT })
	@MaxLength(1000, { message: MESSAGES.DESCRIPTION_INVALID_LENGTH })
	@IsNotEmpty({ message: MESSAGES.DESCRIPTION_REQUIRED_FIELD })
	description!: string;

	@IsDateString({}, { message: MESSAGES.START_DATE_INVALID_DATE_FORMAT })
	@IsFutureDate({ message: MESSAGES.START_DATE_PAST_START_DATE })
	@IsNotEmpty({ message: MESSAGES.START_DATE_REQUIRED_FIELD })
	startDate!: string;

	@IsDateString({}, { message: MESSAGES.END_DATE_INVALID_DATE_FORMAT })
	@IsEndDateAfterStartDate({ message: MESSAGES.END_DATE_INVALID_DATES })
	@IsNotEmpty({ message: MESSAGES.END_DATE_REQUIRED_FIELD })
	endDate!: string;

	@IsDateString({}, { message: MESSAGES.PUBLICATION_DATE_INVALID_FORMAT })
	@IsOptional()
	publicationDate?: string;

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
	@ArrayMinSize(1, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE_MIN })
	@ArrayMaxSize(50, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE })
	@IsOptional()
	categoryIds?: number[];

	@IsInt({ message: MESSAGES.SUPPLIER_ID_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.SUPPLIER_ID_INVALID_INTEGER })
	@IsOptional()
	supplierId?: number;

	@IsUrl({}, { message: MESSAGES.INVALID_URL })
	@IsOptional()
	imageUrl?: string;

	@IsUrl({}, { message: MESSAGES.INVALID_URL })
	@IsOptional()
	linkUrl?: string;
}
