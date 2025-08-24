import { lazy, ComponentType } from 'react';

export const lazyComponent = <T extends ComponentType<object>>(
	importer: () => Promise<{ [key: string]: T }>,
	name: string
) => {
	return lazy(async () => {
		const module = await importer();
		return { default: module[name] };
	});
};