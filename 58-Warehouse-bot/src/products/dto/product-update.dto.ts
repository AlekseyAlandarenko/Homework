import { IsString, IsNumber, IsOptional, IsBoolean, Min, Validate } from 'class-validator';
import { NonEmptyObjectValidator } from './validators/non-empty-object.validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductUpdateDto:
 *       type: object
 *       description: Данные для обновления товара. Требуется хотя бы одно поле.
 *       properties:
 *         name:
 *           type: string
 *           description: Название товара.
 *           example: "Ноутбук HP EliteBook"
 *         description:
 *           type: string
 *           description: Описание товара.
 *           example: "15.6\", Core i7, 16GB RAM"
 *         price:
 *           type: number
 *           format: float
 *           description: Цена товара.
 *           example: 1250.99
 *         quantity:
 *           type: integer
 *           description: Количество товара на складе.
 *           example: 10
 *         category:
 *           type: string
 *           description: Категория товара.
 *           example: "Электроника"
 *         sku:
 *           type: string
 *           description: Уникальный артикул товара.
 *           example: "NB-HP-ELITE-001"
 *         isActive:
 *           type: boolean
 *           description: Статус активности товара.
 *           example: true
 *         isDeleted:
 *           type: boolean
 *           description: Флаг мягкого удаления.
 *           example: false
 */
export class ProductUpdateDto {
	@IsString({ message: MESSAGES.INVALID_NAME })
	@IsOptional()
	name?: string;

	@IsString({ message: MESSAGES.INVALID_DESCRIPTION })
	@IsOptional()
	description?: string | null;

	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Цена') })
	@IsOptional()
	@Min(0, { message: MESSAGES.PRICE_NEGATIVE })
	price?: number;

	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
	@IsOptional()
	@Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
	quantity?: number;

	@IsString({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Категория') })
	@IsOptional()
	category?: string | null;

	@IsString({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Артикул') })
	@IsOptional()
	sku?: string;

	@IsBoolean({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Статус') })
	@IsOptional()
	isActive?: boolean;

	@IsBoolean({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Удален') })
	@IsOptional()
	isDeleted?: boolean;

	@Validate(NonEmptyObjectValidator, { message: MESSAGES.VALIDATION_FAILED })
	private nonEmptyValidation?: boolean;
}
