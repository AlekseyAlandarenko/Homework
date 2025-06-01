import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { MESSAGES } from '../../../common/messages';

/**
 * @swagger
 * components:
 *   schemas:
 *     IsPassword:
 *       type: string
 *       description: Валидатор, проверяющий, что пароль содержит буквы и цифры.
 *       pattern: ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$
 *       example: Str0ngP@ssword
 */
export function IsPassword(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: 'IsPassword',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					if (typeof value !== 'string') return false;
					if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(value)) return false;
					return true;
				},
				defaultMessage(args: ValidationArguments) {
					if (validationOptions?.message) {
						return typeof validationOptions.message === 'string'
							? validationOptions.message
							: validationOptions.message(args);
					}
					return MESSAGES.PASSWORD_COMPLEXITY;
				},
			},
		});
	};
}
