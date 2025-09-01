export function createClassname(
	...args: (string | Record<string, boolean | undefined | null> | false | null | undefined)[]
): string {
	const classes: string[] = [];

	args.forEach((arg) => {
		if (!arg) return;

		if (typeof arg === 'string') {
			classes.push(arg);
		} else if (typeof arg === 'object') {
			Object.entries(arg).forEach(([key, value]) => {
				if (value) classes.push(key);
			});
		}
	});

	return classes.join(' ');
}