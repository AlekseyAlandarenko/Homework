import { FC } from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Title } from '../Title/Title';
import { Paragraph } from '../Paragraph/Paragraph';
import { Button } from '../Button/Button';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './GlobalErrorFallback.module.css';

const Error404: FC = () => (
	<>
		<Title level={2}>{TEXT_CONSTANTS.GLOBAL.ERROR_404_TITLE}</Title>
		<Paragraph size="large" className={styles['error-fallback-description']}>
			{TEXT_CONSTANTS.GLOBAL.ERROR_404_DESCRIPTION}
		</Paragraph>
	</>
);

const Error400: FC<{ message?: string }> = ({ message }) => (
	<>
		<Title level={2}>{TEXT_CONSTANTS.GLOBAL.ERROR_400_TITLE}</Title>
		<Paragraph size="large" className={styles['error-fallback-description']}>
			{message || TEXT_CONSTANTS.GLOBAL.ERROR_400_DESCRIPTION}
		</Paragraph>
	</>
);

const Error500: FC = () => (
	<>
		<Title level={2}>{TEXT_CONSTANTS.GLOBAL.ERROR_500_TITLE}</Title>
		<Paragraph size="large" className={styles['error-fallback-description']}>
			{TEXT_CONSTANTS.GLOBAL.ERROR_500_DESCRIPTION}
		</Paragraph>
		<Button onClick={() => window.location.reload()} className={styles['retry-button']}>
			{TEXT_CONSTANTS.BUTTONS.TRY_AGAIN}
		</Button>
	</>
);

const GenericError: FC<{ title: string; description: string; showRetry?: boolean }> = ({ title, description, showRetry }) => (
	<>
		<Title level={2}>{title}</Title>
		<Paragraph size="large" className={styles['error-fallback-description']}>
			{description}
		</Paragraph>
		{showRetry && (
			<Button onClick={() => window.location.reload()} className={styles['retry-button']}>
				{TEXT_CONSTANTS.BUTTONS.TRY_AGAIN}
			</Button>
		)}
	</>
);

const ErrorWrapper: FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className={styles['error-fallback']}>
		<div className={styles['error-fallback-container']}>
			<div className={styles['error-fallback-text']}>
				{children}
			</div>
		</div>
	</div>
);

export const GlobalErrorFallback: FC = () => {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		if (error.status === 404) return <ErrorWrapper><Error404 /></ErrorWrapper>;
		if (error.status === 400) return <ErrorWrapper><Error400 message={error.data?.message} /></ErrorWrapper>;
		if (error.status === 500) return <ErrorWrapper><Error500 /></ErrorWrapper>;

		return (
			<ErrorWrapper>
				<GenericError 
					title={TEXT_CONSTANTS.GLOBAL.ERROR_TITLE} 
					description={`Ошибка ${error.status}: ${TEXT_CONSTANTS.GLOBAL.ERROR_DESCRIPTION}`} 
					showRetry 
				/>
			</ErrorWrapper>
		);
	}

	if (error instanceof Error) {
		return (
			<ErrorWrapper>
				<GenericError 
					title={TEXT_CONSTANTS.GLOBAL.ERROR_TITLE} 
					description={error.message || TEXT_CONSTANTS.GLOBAL.ERROR_DESCRIPTION} 
					showRetry 
				/>
			</ErrorWrapper>
		);
	}

	return (
		<ErrorWrapper>
			<GenericError 
				title={TEXT_CONSTANTS.GLOBAL.ERROR_TITLE} 
				description={TEXT_CONSTANTS.GLOBAL.ERROR_DESCRIPTION} 
			/>
		</ErrorWrapper>
	);
};