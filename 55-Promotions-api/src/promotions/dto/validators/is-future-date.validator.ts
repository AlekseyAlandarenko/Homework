import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
	registerDecorator,
	ValidationOptions,
} from 'class-validator';
import { MESSAGES } from '../../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     IsFutureDate:
 *       type: string
 *       description: Валидатор, проверяющий, что дата начала акции в будущем.
 *       format: date-time
 *       example: "2023-06-01T00:00:00Z"
 */
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
	validate(date: string) {
		return new Date(date) > new Date();
	}

	defaultMessage() {
		return MESSAGES.PAST_START_DATE;
	}
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
	return (object: object, propertyName: string) => {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options: validationOptions,
			constraints: [],
			validator: IsFutureDateConstraint,
		});
	};
}
