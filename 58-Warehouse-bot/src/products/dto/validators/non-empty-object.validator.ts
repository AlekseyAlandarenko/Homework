import { MESSAGES } from '../../../common/messages';
import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
} from 'class-validator';

interface ProductUpdateFields {
	name?: string;
	description?: string | null;
	price?: number;
	quantity?: number;
	category?: string | null;
	sku?: string;
	isActive?: boolean;
	isDeleted?: boolean;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     NonEmptyObject:
 *       type: object
 *       description: Валидатор, проверяющий, что хотя бы одно поле объекта заполнено корректно.
 *       example:
 *         name: "Ноутбук HP EliteBook"
 *         description: "15.6\", Core i7, 16GB RAM"
 *         price: 1250.99
 *         quantity: 10
 */
@ValidatorConstraint({ name: 'nonEmptyObject', async: false })
export class NonEmptyObjectValidator implements ValidatorConstraintInterface {
	validate(_value: any, args: ValidationArguments): boolean {
		const obj = args.object as ProductUpdateFields;

		const fields: (keyof ProductUpdateFields)[] = [
			'name',
			'description',
			'price',
			'quantity',
			'category',
			'sku',
			'isActive',
			'isDeleted',
		];

		return fields.some((key) => {
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

			return false;
		});
	}

	defaultMessage(): string {
		return MESSAGES.VALIDATION_FAILED;
	}
}
