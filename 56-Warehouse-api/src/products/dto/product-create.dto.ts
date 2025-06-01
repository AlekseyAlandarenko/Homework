import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductCreateDto:
 *       type: object
 *       description: Данные для создания товара.
 *       required:
 *         - name
 *         - price
 *         - quantity
 *         - sku
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
export class ProductCreateDto {
	@IsString({ message: MESSAGES.INVALID_NAME })
	name!: string;

	@IsString({ message: MESSAGES.INVALID_DESCRIPTION })
	@IsOptional()
	description?: string;

	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Цена') })
	@Min(0, { message: MESSAGES.PRICE_NEGATIVE })
	price!: number;

	@IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
	@Min(0, { message: MESSAGES.QUANTITY_NEGATIVE })
	quantity!: number;

	@IsString({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Категория') })
	@IsOptional()
	category?: string;

	@IsString({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Артикул') })
	sku!: string;

	@IsBoolean({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Статус') })
	@IsOptional()
	isActive?: boolean;

	@IsBoolean({ message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Удален') })
	@IsOptional()
	isDeleted?: boolean;
}
