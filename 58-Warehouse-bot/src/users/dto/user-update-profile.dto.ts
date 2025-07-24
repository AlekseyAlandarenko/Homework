import {
	IsArray,
	IsInt,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	ArrayMaxSize,
	Matches,
	ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MESSAGES } from '../../common/messages';
import { AddressDto } from './user-address.dto';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserUpdateProfileDto:
 *       type: object
 *       description: DTO для обновления профиля пользователя.
 *       properties:
 *         name:
 *           type: string
 *           description: Новое имя пользователя (только буквы, пробелы и дефисы).
 *           example: Иван Петров
 *           maxLength: 100
 *           nullable: true
 *         cityId:
 *           type: integer
 *           description: Идентификатор города пользователя.
 *           example: 1
 *           nullable: true
 *         categoryIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: Идентификаторы предпочитаемых категорий.
 *           example: [1, 2]
 *           nullable: true
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AddressDto'
 *           description: Список адресов доставки пользователя.
 *           example: [{ address: ул. Примерная, д. 1, Москва, isDefault: true }]
 *           nullable: true
 */
export class UserUpdateProfileDto {
	@IsString({ message: MESSAGES.NAME_INVALID_FORMAT })
	@MaxLength(100, { message: MESSAGES.NAME_INVALID_NAME_LENGTH })
	@Matches(/^[A-Za-zА-Яа-яёЁ\s-]+$/, {
		message: MESSAGES.NAME_INVALID_NAME_FORMAT,
	})
	@Transform(({ value }) => value.trim())
	@IsOptional()
	name?: string;

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

	@ValidateNested({ each: true })
	@Type(() => AddressDto)
	@IsOptional()
	addresses?: AddressDto[];
}
