import { FC, ReactNode } from 'react';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import styles from './HeaderWrapper.module.css';
import { createClassname } from '../../utils/classnameUtils';

interface HeaderWrapperProps {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export const HeaderWrapper: FC<HeaderWrapperProps> = ({
	title,
	description,
	className,
	children
}) => {
	const rootClassName = createClassname('section-header', styles.header, className);

	return (
		<div className={rootClassName}>
			<div className={styles.headerText}>
				<Title level={1}>{title}</Title>
				{description && <Paragraph>{description}</Paragraph>}
			</div>
			{children}
		</div>
	);
};