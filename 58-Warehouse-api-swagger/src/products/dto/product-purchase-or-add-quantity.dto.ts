import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { MESSAGES } from '../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductQuantityDto:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 5
 */
export class ProductPurchaseOrAddQuantityDto {
    @IsNumber({}, { message: MESSAGES.INVALID_FORMAT.replace('{{field}}', 'Количество') })
    @IsNotEmpty({ message: MESSAGES.REQUIRED_FIELD.replace('{{field}}', 'Количество') })
    @Min(1, { message: MESSAGES.QUANTITY_ZERO_OR_NEGATIVE })
    quantity!: number;
}
