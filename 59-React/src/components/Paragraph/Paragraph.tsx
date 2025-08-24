import { FC, ReactNode, ElementType, memo } from 'react';
import classNames from 'classnames';
import styles from './Paragraph.module.css';

export type ParagraphSize = 'extra-small' | 'regular' | 'large';
export type ParagraphWeight = 'normal' | 'bold' | 'extra-bold';

interface ParagraphProps {
  as?: ElementType;
  size?: ParagraphSize;
  weight?: ParagraphWeight;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

export const Paragraph: FC<ParagraphProps> = memo(
	({
		as: Component = 'p',
		size = 'regular',
		weight = 'normal',
		children,
		className,
		id,
		...props
	}) => {
		const paragraphClass = classNames(
			styles.paragraph,
			styles[`paragraph-${size}`],
			weight && styles[`paragraph-${weight}`],
			className
		);

		return (
			<Component className={paragraphClass} id={id} {...props}>
				{children}
			</Component>
		);
	}
);