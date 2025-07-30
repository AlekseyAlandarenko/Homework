import styles from './LoginPage.module.css';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Title from '../Title/Title';
import Button from '../Button/Button';
import Input from '../Input/Input';
import { useAuth } from '../../context/AuthContext.jsx';
import { useForm } from '../../hooks/useForm.jsx';

function LoginPage() {
	const validateInputs = useCallback(({ username, password }) => {
		if (!username || !password) {
			return 'Пожалуйста, введите имя пользователя и пароль';
		}
		if (username.length < 3) {
			return 'Имя пользователя должно содержать минимум 3 символа';
		}
		if (password.length < 6) {
			return 'Пароль должен содержать минимум 6 символов';
		}
		return '';
	}, []);

	const { formData, error, handleInputChange, handleSubmit } = useForm(
		{ username: '', password: '' },
		validateInputs
	);
	const { login, navLinks } = useAuth();
	const navigate = useNavigate();

	const onLogin = useCallback(
		() => {
			login(formData.username);
			navigate('/');
		},
		[formData, login, navigate]
	);

	return (
		<div className={styles.app}>
			<Header badgeValue={0} navLinks={navLinks} />
			<div className="fixed-section">
				<div className={styles['login-container']}>
					<Title level={1}>Вход</Title>
					{error && <p className={styles.error}>{error}</p>}
					<div className={styles['login-row']}>
						<div className={styles['input-wrapper-fixed']}>
							<Input
								value={formData.username}
								onChange={handleInputChange}
								placeholder="Имя пользователя"
								appearance="text"
								className={styles['login-input']}
								name="username"
							/>
							<div className={styles['password-row']}>
								<Input
									value={formData.password}
									onChange={handleInputChange}
									placeholder="Пароль"
									type="password"
									appearance="text"
									className={styles['login-input']}
									name="password"
								/>
								<Button
									modifiers={['buttonSearch']}
									onClick={() => handleSubmit(onLogin)}
									className={styles['login-button']}
								>
                  Войти
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default LoginPage;