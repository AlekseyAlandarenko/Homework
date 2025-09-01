import { FC } from 'react';

interface SearchIcon {
  stroke?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const SearchIcon: FC<SearchIcon> = ({
	stroke = 'currentColor',
	width = 24,
	height = 24,
	className
}) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
	>
		<path
			d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
			stroke={stroke}
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M22 22L20 20"
			stroke={stroke}
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);
