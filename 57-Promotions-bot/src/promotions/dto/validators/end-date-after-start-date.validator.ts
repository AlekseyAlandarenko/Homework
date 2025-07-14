import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    registerDecorator,
    ValidationOptions,
} from 'class-validator';
import { MESSAGES } from '../../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     IsEndDateAfterStartDate:
 *       type: string
 *       description: Валидатор, проверяющий, что дата окончания акции (endDate) позже даты начала (startDate).
 *       format: date-time
 *       example: "2025-08-01T23:59:59Z"
 */
@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
    validate(endDate: string, args: ValidationArguments) {
        const { startDate } = args.object as any;
        return new Date(endDate) > new Date(startDate);
    }

    defaultMessage() {
        return MESSAGES.INVALID_DATES;
    }
}

export function IsEndDateAfterStartDate(validationOptions?: ValidationOptions) {
    return (object: object, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsEndDateAfterStartDateConstraint,
        });
    };
}
