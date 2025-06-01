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
 *       description: Валидатор, проверяющий, что хотя бы одно поле объекта заполнено корректно.
 */
@ValidatorConstraint({ name: 'nonEmptyObject', async: false })
export class NonEmptyObjectValidator implements ValidatorConstraintInterface {
	validate(_value: unknown, args: ValidationArguments): boolean {
		const obj = args.object as Record<string, unknown>;
		const options = args.constraints[0] || { validateDates: false };

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

			if (options.validateDates && (key === 'startDate' || key === 'endDate')) {
				const date = new Date(value as string);
				return !isNaN(date.getTime());
			}

			return false;
		});
	}

	defaultMessage(): string {
		return MESSAGES.VALIDATION_FAILED;
	}
}
