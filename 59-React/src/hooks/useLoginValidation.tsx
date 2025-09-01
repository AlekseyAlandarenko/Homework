import { TEXT_CONSTANTS } from '../constants/textConstants';

export interface LoginFormData {
  username: string;
  password: string;
}

const validationMessages = {
	emptyUsername: TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.EMPTY_USERNAME,
	emptyPassword: TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.EMPTY_PASSWORD,
	emptyProfileName: TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.EMPTY_PROFILE_NAME,
	shortProfileName: TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.SHORT_PROFILE_NAME,
	shortUsername: TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.SHORT_USERNAME,
	shortPassword: TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.SHORT_PASSWORD
};

const validateUsername = (
	username: string,
	isAddingProfile: boolean,
	isRegistering: boolean
): string | undefined => {
	if (!username) {
		return isAddingProfile ? validationMessages.emptyProfileName : validationMessages.emptyUsername;
	}
	if ((isAddingProfile || isRegistering) && username.length < TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.MIN_USERNAME_LENGTH) {
		return isAddingProfile ? validationMessages.shortProfileName : validationMessages.shortUsername;
	}
	return undefined;
};

const validatePassword = (password: string, isRegistering: boolean): string | undefined => {
	if (!password) {
		return validationMessages.emptyPassword;
	}
	if (isRegistering && password.length < TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.MIN_PASSWORD_LENGTH) {
		return validationMessages.shortPassword;
	}
	return undefined;
};

export const useLoginValidation = (isAddingProfile: boolean = false, isRegistering: boolean = false) => {
	const validate = ({ username, password }: LoginFormData) => {
		const errors: Partial<Record<keyof LoginFormData, string>> = {};
		const variants: Partial<Record<keyof LoginFormData, 'default' | 'error'>> = {};

		errors.username = validateUsername(username, isAddingProfile, isRegistering);
		variants.username = errors.username ? 'error' : 'default';

		if (!isAddingProfile) {
			errors.password = validatePassword(password, isRegistering);
			variants.password = errors.password ? 'error' : 'default';
		}

		return { errors, variants };
	};

	return { validate };
};