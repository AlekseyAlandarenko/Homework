export function getDeclension(count: number, forms: [string, string, string]): string {
	const absCount = Math.abs(count) % 100;
	if (absCount >= 11 && absCount <= 14) return forms[2];
	switch (absCount % 10) {
	case 1: return forms[0];
	case 2:
	case 3:
	case 4: return forms[1];
	default: return forms[2];
	}
}