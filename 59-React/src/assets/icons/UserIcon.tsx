import { FC } from 'react';

interface UserIconProps {
  stroke?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  strokeWidth?: string | number;
}

export const UserIcon: FC<UserIconProps> = ({
	stroke = 'currentColor',
	width = 24,
	height = 24,
	className,
	strokeWidth = '1.5'
}) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		stroke={stroke}
		strokeWidth={strokeWidth}
	>
		<circle cx="12" cy="6" r="4" stroke={stroke} strokeWidth={strokeWidth} />
		<ellipse cx="12" cy="17" rx="7" ry="4" stroke={stroke} strokeWidth={strokeWidth} />
	</svg>
);