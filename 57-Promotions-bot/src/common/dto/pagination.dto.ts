import { IsInt, Min } from 'class-validator';
import { MESSAGES } from '../messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     PaginationDto:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *           example: 10
 */
export class PaginationDto {
	@IsInt({ message: MESSAGES.INVALID_FORMAT })
	@Min(1, { message: MESSAGES.VALIDATION_FAILED })
	page: number = 1;

	@IsInt({ message: MESSAGES.INVALID_FORMAT })
	@Min(1, { message: MESSAGES.VALIDATION_FAILED })
	limit: number = 10;
}
