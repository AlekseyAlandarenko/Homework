import { FC, ReactElement, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HeaderWrapper } from '../HeaderWrapper/HeaderWrapper';
import { InputButtonRow } from '../InputButtonRow/InputButtonRow';
import { TEXT_CONSTANTS } from '../../constants/textConstants';
import { useForm } from '../../hooks/useForm';
import { loginAsync, registerAsync, addProfileAsync } from '../../store/usersSlice';
import { RootState, AppDispatch } from '../../store/store';
import { useLoginValidation } from '../../hooks/useLoginValidation';
import { LoadingType } from '../../store/usersSlice';
import styles from './LoginPage.module.css';

const modeConfig = {
	login: {
		title: TEXT_CONSTANTS.LOGIN_PAGE.TITLE,
		usernamePlaceholder: TEXT_CONSTANTS.LOGIN_PAGE.USERNAME_PLACEHOLDER,
		buttonText: TEXT_CONSTANTS.LOGIN_PAGE.LOGIN_BUTTON
	},
	register: {
		title: TEXT_CONSTANTS.LOGIN_PAGE.REGISTER,
		usernamePlaceholder: TEXT_CONSTANTS.LOGIN_PAGE.USERNAME_PLACEHOLDER,
		buttonText: TEXT_CONSTANTS.LOGIN_PAGE.REGISTER_BUTTON
	},
	addProfile: {
		title: TEXT_CONSTANTS.LOGIN_PAGE.ADD_PROFILE,
		usernamePlaceholder: TEXT_CONSTANTS.LOGIN_PAGE.PROFILE_NAME_PLACEHOLDER,
		buttonText: TEXT_CONSTANTS.LOGIN_PAGE.ADD_BUTTON
	}
};

export const LoginPage: FC = (): ReactElement => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch: AppDispatch = useDispatch();

	const mode = new URLSearchParams(location.search).get('mode');
	const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

	const isAddingProfile = mode === 'add-profile';
	const isRegistering = mode === 'register';
	const currentMode = isAddingProfile ? 'addProfile' : isRegistering ? 'register' : 'login';

	const { validate } = useLoginValidation(isAddingProfile, isRegistering);
	const isLoading = useSelector((state: RootState) => state.users.loading !== LoadingType.NONE);

	const { formData, errors, variants, handleInputChange, handleSubmit, setErrors, setVariants, setFormData } = useForm(
		{ username: '', password: '' },
		validate
	);

	useEffect(() => {
		const resetForm = () => {
			setFormData({ username: '', password: '' });
			setErrors({});
			setVariants({ username: 'default', password: 'default' });
		};
		resetForm();
	}, [mode, setFormData, setErrors, setVariants]);

	const onSubmit = async () => {
		const thunk = isAddingProfile ? addProfileAsync : isRegistering ? registerAsync : loginAsync;
		const result = await dispatch(
			thunk({
				login: formData.username,
				password: formData.password
			})
		);

		if (thunk.fulfilled.match(result)) {
			navigate(redirectPath);
		} else if (thunk.rejected.match(result)) {
			const payload = result.payload as { username?: string; password?: string };

			setErrors({
				username: payload?.username || '',
				password: payload?.password || TEXT_CONSTANTS.ERRORS.INVALID_CREDENTIALS
			});

			setVariants({
				username: payload?.username ? 'error' : (payload?.password ? 'error' : 'default'),
				password: payload?.password ? 'error' : 'default'
			});
		}
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSubmit(onSubmit);
	};

	return (
		<div className={styles['login-container']}>
			<HeaderWrapper title={modeConfig[currentMode].title}>
				<div className={styles['login-form-wrapper']}>
					<form onSubmit={handleFormSubmit} className={styles['login-form']}>
						<InputButtonRow
							name="username"
							placeholder={modeConfig[currentMode].usernamePlaceholder}
							value={formData.username}
							onChange={handleInputChange}
							error={errors.username}
							variant={variants.username}
							type="text"
							buttonText={isAddingProfile ? modeConfig.addProfile.buttonText : undefined}
							buttonType={isAddingProfile ? 'submit' : 'button'}
							disabled={isLoading}
							isLoading={isLoading}
						/>
						{!isAddingProfile && (
							<InputButtonRow
								name="password"
								placeholder={TEXT_CONSTANTS.LOGIN_PAGE.PASSWORD_PLACEHOLDER}
								value={formData.password}
								onChange={handleInputChange}
								error={errors.password}
								variant={variants.password}
								type="password"
								buttonText={modeConfig[currentMode].buttonText}
								buttonType="submit"
								disabled={isLoading}
								isLoading={isLoading}
							/>
						)}
					</form>
				</div>
			</HeaderWrapper>
		</div>
	);
};