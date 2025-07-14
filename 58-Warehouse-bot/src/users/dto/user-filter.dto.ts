import { IsOptional, IsBoolean, IsInt, IsIn, Min, IsArray, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserFilterDto:
 *       type: object
 *       description: DTO для фильтрации начальников склада.
 *       properties:
 *         hasProducts:
 *           type: boolean
 *           description: Фильтр по наличию активных продуктов.
 *           example: true
 *           nullable: true
 *         hasAddresses:
 *           type: boolean
 *           description: Фильтр по наличию адресов.
 *           example: true
 *           nullable: true
 *         cityId:
 *           type: integer
 *           description: Идентификатор города для фильтрации.
 *           example: 1
 *           nullable: true
 *         categoryIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: Идентификаторы категорий для фильтрации.
 *           example: [1, 2]
 *           nullable: true
 *         sortBy:
 *           type: string
 *           enum: [createdAt, email, name]
 *           description: Поле для сортировки.
 *           example: createdAt
 *           nullable: true
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 *           description: Порядок сортировки.
 *           example: desc
 *           nullable: true
 */
export class UserFilterDto {
	@IsBoolean({ message: MESSAGES.ACTIVE_INVALID_BOOLEAN })
	@IsOptional()
	hasProducts?: boolean;

	@IsBoolean({ message: MESSAGES.ACTIVE_INVALID_BOOLEAN })
	@IsOptional()
	hasAddresses?: boolean;

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
	@ArrayMaxSize(50, { message: MESSAGES.CATEGORY_IDS_INVALID_ARRAY_SIZE })
	@IsOptional()
	categoryIds?: number[];

	@IsIn(['createdAt', 'email', 'name'], {
		message: MESSAGES.SORT_BY_INVALID_FORMAT,
	})
	@IsOptional()
	sortBy?: string;

	@IsIn(['asc', 'desc'], { message: MESSAGES.SORT_ORDER_INVALID_FORMAT })
	@IsOptional()
	sortOrder?: string;
}