export const handleImageError = (placeholder: string) => 
	(e: React.SyntheticEvent<HTMLImageElement>) => {
		const target = e.target as HTMLImageElement;
		target.src = placeholder;
		target.onerror = null;
	};