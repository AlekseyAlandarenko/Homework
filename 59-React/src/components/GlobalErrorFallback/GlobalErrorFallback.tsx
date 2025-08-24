import { FC } from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import { Button } from '../Button/Button';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './GlobalErrorFallback.module.css';

export const GlobalErrorFallback: FC = () => {
	const error = useRouteError();

	let title: string = TEXT_CONSTANTS.GLOBAL.ERROR_TITLE;
	let description: string = TEXT_CONSTANTS.GLOBAL.ERROR_DESCRIPTION;
	let showRetry = false;

	const errorStatusMap: Record<number, 
	{ title: string; description: string; retry?: boolean }
	> = {
		404: {
			title: TEXT_CONSTANTS.GLOBAL.ERROR_404_TITLE,
			description: TEXT_CONSTANTS.GLOBAL.ERROR_404_DESCRIPTION
		},
		400: {
			title: TEXT_CONSTANTS.GLOBAL.ERROR_400_TITLE,
			description: TEXT_CONSTANTS.GLOBAL.ERROR_400_DESCRIPTION
		},
		500: {
			title: TEXT_CONSTANTS.GLOBAL.ERROR_500_TITLE,
			description: TEXT_CONSTANTS.GLOBAL.ERROR_500_DESCRIPTION,
			retry: true
		}
	};

	if (isRouteErrorResponse(error)) {
		const statusConfig = errorStatusMap[error.status];
		if (statusConfig) {
			title = statusConfig.title;
			description = error.status === 400 && error.data?.message
				? error.data.message
				: statusConfig.description;
			showRetry = !!statusConfig.retry;
		} else {
			title = TEXT_CONSTANTS.GLOBAL.ERROR_TITLE;
			description = `Ошибка ${error.status}: ${TEXT_CONSTANTS.GLOBAL.ERROR_DESCRIPTION}`;
			showRetry = true;
		}
	} else if (error instanceof Error) {
		description = error.message || description;
		showRetry = true;
	}

	const handleRetry = () => window.location.reload();

	return (
		<div className={styles['error-fallback']}>
			<div className={styles['error-fallback-container']}>
				<div className={styles['error-fallback-text']}>
					<Title level={2}>{title}</Title>
					<Paragraph size="large" className={styles['error-fallback-description']}>
						{description}
					</Paragraph>
					{showRetry && (
						<Button onClick={handleRetry} className={styles['retry-button']}>
							{TEXT_CONSTANTS.BUTTONS.TRY_AGAIN}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};