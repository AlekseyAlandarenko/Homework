import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Title } from '../Title/Title';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { useLoginValidation } from '../../hooks/useLoginValidation';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import styles from './LoginPage.module.css';

export const LoginPage: FC = () => {
	const navigate = useNavigate();
	const { setCurrentUser } = useAuth();
	const { validate } = useLoginValidation();

	const { formData, error, handleInputChange, handleSubmit } = useForm(
		{ username: '', password: '' },
		validate
	);

	const handleLoginClick = () => {
		const success = handleSubmit(() => {
			setCurrentUser(formData.username);
			navigate('/');
		});
		if (!success) return;
	};

	const renderFormInputs = () => (
		<div className={styles['login-row']}>
			<div className={styles['input-wrapper-fixed']}>
				<div className={styles['password-row']}>
					<Input
						value={formData.username}
						onChange={handleInputChange}
						placeholder="Имя пользователя"
						variant={error ? 'error' : 'default'}
						className={styles['login-input']}
						name="username"
					/>
				</div>
				<div className={styles['password-row']}>
					<Input
						value={formData.password}
						onChange={handleInputChange}
						placeholder="Пароль"
						type="password"
						variant={error ? 'error' : 'default'}
						className={styles['login-input']}
						name="password"
					/>
					<Button
						variant="search"
						onClick={handleLoginClick}
					>
						{TEXT_CONSTANTS.LOGIN_PAGE.LOGIN_BUTTON}
					</Button>
				</div>
			</div>
		</div>
	);

	return (
		<div className={styles['login-container']}>
			<div className={styles['login-header']}>
				<Title level={1}>{TEXT_CONSTANTS.LOGIN_PAGE.TITLE}</Title>
				{error && <p className={styles['error']}>{error}</p>}
				{renderFormInputs()}
			</div>
		</div>
	);
};