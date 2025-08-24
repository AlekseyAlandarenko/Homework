import { AppDispatch } from '../store/store';
import { openModal } from '../store/usersSlice';

export const showDeleteAccountModal = (dispatch: AppDispatch, account: string) => {
	dispatch(openModal({
		modalType: 'deleteAccount',
		metadata: { account }
	}));
};

export const showRemoveProfileModal = (dispatch: AppDispatch, account: string, profile: string) => {
	dispatch(openModal({
		modalType: 'removeProfile',
		metadata: { account, profile }
	}));
};