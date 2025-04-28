import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
	registerDecorator,
	ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
	validate(endDate: string, args: ValidationArguments) {
		const { startDate } = args.object as any;
		if (!startDate || !endDate) return true;
		return new Date(endDate) > new Date(startDate);
	}

	defaultMessage() {
		return 'Дата окончания должна быть позже даты начала';
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