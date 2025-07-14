import { MESSAGES } from '../../../common/messages';
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     NonEmptyObject:
 *       type: object
 *       description: Валидатор, проверяющий, что объект содержит хотя бы одно заполненное поле (непустая строка, валидное число, булево значение или непустой массив).
 *       example:
 *         name: "Ноутбук HP EliteBook"
 */
@ValidatorConstraint({ name: 'nonEmptyObject', async: false })
export class NonEmptyObjectValidator implements ValidatorConstraintInterface {
    validate(_value: unknown, args: ValidationArguments): boolean {
        const obj = args.object as Record<string, unknown>;

        return Object.keys(obj).some((key) => {
            const value = obj[key];

            if (value === undefined || value === null) {
                return false;
            }

            if (typeof value === 'string') {
                return value.trim().length > 0;
            }

            if (typeof value === 'number') {
                return !isNaN(value);
            }

            if (typeof value === 'boolean') {
                return true;
            }

            if (Array.isArray(value)) {
                return value.length > 0;
            }

            return false;
        });
    }

    defaultMessage(): string {
        return MESSAGES.VALIDATION_ERROR;
    }
}
