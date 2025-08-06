import { useState, useCallback, ChangeEvent } from 'react';

interface FormData {
  [key: string]: string;
}

interface UseFormReturn<T extends FormData> {
  formData: T;
  error: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (onSubmit: (data: T) => void) => boolean;
  setError: (error: string) => void;
}

export const useForm = <T extends FormData>(initialValues: T, validate: (data: T) => string): UseFormReturn<T> => {
	const [formData, setFormData] = useState<T>(initialValues);
	const [error, setError] = useState<string>('');

	const handleInputChange = useCallback(({ target: { name, value } }: ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		setError('');
	}, []);

	const handleSubmit = useCallback(
		(onSubmit: (data: T) => void) => {
			const validationError = validate(formData);
			if (validationError) {
				setError(validationError);
				return false;
			}
			onSubmit(formData);
			return true;
		},
		[formData, validate]
	);

	return {
		formData,
		error,
		handleInputChange,
		handleSubmit,
		setError
	};
};