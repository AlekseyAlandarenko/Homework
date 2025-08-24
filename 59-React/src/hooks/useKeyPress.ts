import { KeyboardEvent } from 'react';

export const useKeyPress = (onAction?: () => void) => {
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onAction?.();
		}
	};

	return { handleKeyDown };
};