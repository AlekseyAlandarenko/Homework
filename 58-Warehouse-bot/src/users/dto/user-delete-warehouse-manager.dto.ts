import { IsInt, Min, IsOptional } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     WarehouseManagerDeleteDto:
 *       type: object
 *       description: DTO для удаления менеджера склада.
 *       properties:
 *         newResponsibleId:
 *           type: integer
 *           description: Идентификатор нового ответственного за активные продукты (если требуется).
 *           example: 2
 *           nullable: true
 */
export class WarehouseManagerDeleteDto {
	@IsInt({ message: MESSAGES.USER_ID_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.USER_ID_INVALID_INTEGER })
	@IsOptional()
	newResponsibleId?: number;
}