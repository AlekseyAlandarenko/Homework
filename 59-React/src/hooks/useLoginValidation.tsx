import { TEXT_CONSTANTS } from '../constants/textConstants';

export interface LoginFormData {
  username: string;
  password: string;
}

export const useLoginValidation = () => {
	const validate = ({ username, password }: LoginFormData): string => {
		if (!username || !password) {
			return TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.EMPTY_FIELDS;
		}
		if (username.length < 3) {
			return TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.SHORT_USERNAME;
		}
		if (password.length < 6) {
			return TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.SHORT_PASSWORD;
		}
		return '';
	};

	return { validate };
};