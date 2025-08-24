import he from 'he';

export function decodeHtml(str: string): string {
	return he.decode(str || '');
}