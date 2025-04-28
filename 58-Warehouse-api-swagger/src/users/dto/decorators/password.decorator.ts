import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { MESSAGES } from '../../../common/messages';

export function IsPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          if (value.length < 8) return false;
          if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value)) return false;
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