import { FC } from 'react';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import styles from './Placeholder.module.css';
import { TEXT_CONSTANTS } from '../../constants/textConstants';

export const Placeholder: FC = () => (
	<div className={styles.placeholder}>
		<div className={styles['placeholder-container']}>
			<div className={styles['placeholder-text']}>
				<Title level={2}>{TEXT_CONSTANTS.SEARCH_PAGE.NOT_FOUND_TITLE}</Title>
				<Paragraph size="large" className={styles['placeholder-description']}>
					{TEXT_CONSTANTS.SEARCH_PAGE.NOT_FOUND_DESCRIPTION}
				</Paragraph>
			</div>
		</div>
	</div>
);