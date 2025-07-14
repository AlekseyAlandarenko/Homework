import { IsString, IsNotEmpty, MaxLength, IsBoolean } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     AddressDto:
 *       type: object
 *       description: DTO для адреса пользователя.
 *       properties:
 *         address:
 *           type: string
 *           description: Адрес доставки пользователя.
 *           example: "ул. Примерная, д. 1, Москва"
 *           maxLength: 255
 *         isDefault:
 *           type: boolean
 *           description: Флаг, указывающий, является ли адрес основным.
 *           example: true
 *       required:
 *         - address
 *         - isDefault
 */
export class AddressDto {
	@IsString({ message: MESSAGES.ADDRESS_INVALID_FORMAT })
	@IsNotEmpty({ message: MESSAGES.ADDRESS_REQUIRED_FIELD })
	@MaxLength(255, { message: MESSAGES.ADDRESS_INVALID_LENGTH })
	address!: string;

	@IsBoolean({ message: MESSAGES.ADDRESS_INVALID_DEFAULT })
	isDefault!: boolean;
}