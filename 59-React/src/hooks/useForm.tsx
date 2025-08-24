import { useState, ChangeEvent, useCallback } from 'react';
import { TEXT_CONSTANTS } from '../constants/textConstants';

type FormErrors<T extends FormData> = {
  [K in keyof T]?: string;
};

type FormVariants<T extends FormData> = {
  [K in keyof T]?: 'default' | 'error';
};

interface FormData {
  [key: string]: string;
}

interface UseFormReturn<T extends FormData> {
  formData: T;
  errors: FormErrors<T>;
  variants: FormVariants<T>;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (onSubmit: (data: T) => void) => void;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors<T>>>;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  setVariants: React.Dispatch<React.SetStateAction<FormVariants<T>>>;
}

export const useForm = <T extends FormData>(
	initialValue: T,
	validate?: (data: T) => { errors: FormErrors<T>; variants: FormVariants<T> }
): UseFormReturn<T> => {
	const [formData, setFormData] = useState<T>(initialValue);
	const [errors, setErrors] = useState<FormErrors<T>>({});
	const [variants, setVariants] = useState<FormVariants<T>>({});

	const handleInputChange = useCallback(
		({ target: { name, value } }: ChangeEvent<HTMLInputElement>) => {
			setFormData((prev) => ({ ...prev, [name]: value }));

			const isSpecificError =
        errors.username === TEXT_CONSTANTS.ERRORS.INVALID_CREDENTIALS ||
        errors.password === TEXT_CONSTANTS.ERRORS.INVALID_CREDENTIALS ||
        errors.username === TEXT_CONSTANTS.ERRORS.ACCOUNT_ALREADY_EXISTS ||
        errors.password === TEXT_CONSTANTS.ERRORS.ACCOUNT_ALREADY_EXISTS;

			if (isSpecificError) {
				setErrors({ username: undefined, password: undefined });
				setVariants({ username: 'default', password: 'default' });
			} else {
				setErrors((prev) => ({ ...prev, [name]: undefined }));
				setVariants((prev) => ({ ...prev, [name]: 'default' }));
			}
		},
		[setFormData, errors, setErrors, setVariants]
	);

	const handleSubmit = useCallback(
		(onSubmit: (data: T) => void) => {
			const validationResult = validate?.(formData) || { errors: {}, variants: {} };
			setErrors(validationResult.errors);
			setVariants(validationResult.variants);

			const hasErrors = Object.values(validationResult.errors).some(Boolean);
			if (!hasErrors) {
				onSubmit(formData);
			}
		},
		[validate, formData, setErrors, setVariants]
	);

	return {
		formData,
		errors,
		variants,
		handleInputChange,
		handleSubmit,
		setErrors,
		setFormData,
		setVariants
	};
};