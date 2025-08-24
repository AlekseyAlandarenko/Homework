import { useEffect, useRef } from 'react';

export const useFocusTrap = <T extends HTMLElement = HTMLDivElement>(isOpen: boolean) => {
	const ref = useRef<T>(null);
	const lastFocusedElement = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (isOpen) {
			lastFocusedElement.current = document.activeElement as HTMLElement;
			ref.current?.focus();
		} else {
			lastFocusedElement.current?.focus();
		}
	}, [isOpen]);

	return ref;
};