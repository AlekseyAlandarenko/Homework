import { useState, useCallback } from 'react';

export const useForm = (initialValues, validate) => {
	const [formData, setFormData] = useState(initialValues);
	const [error, setError] = useState('');

	const handleInputChange = useCallback((e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
		setError('');
	}, []);

	const handleSubmit = useCallback(
		(onSubmit) => {
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