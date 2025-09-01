import { createSlice, createEntityAdapter, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from './store';
import { TEXT_CONSTANTS } from '../constants/textConstants';
import type { Movie } from '../interfaces/movie.interface';
import { Account, Profile } from '../interfaces/user.interface';
import bcrypt from 'bcryptjs';

export interface ExtendedProfile extends Profile {
  id: string;
  accountId: string;
  name: string;
  favorites: Movie[];
  isCurrent?: boolean;
}

export interface ModalState {
  isOpen: boolean;
  modalType: 'removeProfile' | 'deleteAccount' | null;
  metadata?: {
    account?: string;
    profile?: string;
  };
}

export enum LoadingType {
  NONE = 'NONE',
  LOGIN = 'LOGIN',
  REMOVE_PROFILE = 'REMOVE_PROFILE',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  TOGGLE_FAVORITE = 'TOGGLE_FAVORITE'
}

export interface UsersState {
  accounts: ReturnType<typeof accountsAdapter.getInitialState>;
  profiles: ReturnType<typeof profilesAdapter.getInitialState>;
  currentAccountId: string | null;
  currentProfileId: string | null;
  modal: ModalState;
  loading: LoadingType;
  error: string | null;
}

export const accountsAdapter = createEntityAdapter<Account, string>({
	selectId: (account) => account.login
});

export const profilesAdapter = createEntityAdapter<ExtendedProfile, string>({
	selectId: (profile) => profile.id
});

const initialState: UsersState = {
	accounts: accountsAdapter.getInitialState(),
	profiles: profilesAdapter.getInitialState(),
	currentAccountId: null,
	currentProfileId: null,
	modal: {
		isOpen: false,
		modalType: null
	},
	loading: LoadingType.NONE,
	error: null
};

export const loginAsync = createAsyncThunk<
  { login: string; profile: string },
  { login: string; password: string },
  { state: RootState; rejectValue: { username?: string; password?: string } }
>(
	'users/loginAsync',
	async ({ login, password }, { getState, rejectWithValue }) => {
		const state = getState();
		const accountExists = accountsAdapter.getSelectors().selectById(state.users.accounts, login);

		if (!accountExists) {
			return rejectWithValue({ password: TEXT_CONSTANTS.ERRORS.INVALID_CREDENTIALS });
		}
		if (!password || !bcrypt.compareSync(password, accountExists.password)) {
			return rejectWithValue({ password: TEXT_CONSTANTS.ERRORS.INVALID_CREDENTIALS });
		}
		return { login, profile: TEXT_CONSTANTS.COMMON.MAIN_PROFILE_NAME };
	}
);

export const registerAsync = createAsyncThunk<
  { login: string; profile: string; hashedPassword: string },
  { login: string; password: string },
  { state: RootState; rejectValue: { username?: string; password?: string } }
>(
	'users/registerAsync',
	async ({ login, password }, { getState, rejectWithValue }) => {
		const state = getState();
		const accountExists = accountsAdapter.getSelectors().selectById(state.users.accounts, login);

		if (accountExists) {
			return rejectWithValue({
				password: TEXT_CONSTANTS.ERRORS.ACCOUNT_ALREADY_EXISTS
			});
		}
		if (!password) {
			return rejectWithValue({ password: TEXT_CONSTANTS.ERRORS.PASSWORD_REQUIRED });
		}
		if (password.length < TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.MIN_PASSWORD_LENGTH) {
			return rejectWithValue({ password: TEXT_CONSTANTS.LOGIN_PAGE.VALIDATION.SHORT_PASSWORD });
		}
		const hashedPassword = bcrypt.hashSync(password, 10);
		return { login, profile: TEXT_CONSTANTS.COMMON.MAIN_PROFILE_NAME, hashedPassword };
	}
);

export const addProfileAsync = createAsyncThunk<
  { login: string; profile: string },
  { login: string },
  { state: RootState; rejectValue: { username?: string } }
>(
	'users/addProfileAsync',
	async ({ login: profileName }, { getState, rejectWithValue }) => {
		const state = getState();
		const account = state.users.currentAccountId;
		if (!account) {
			return rejectWithValue({ username: TEXT_CONSTANTS.ERRORS.ACCOUNT_NOT_EXISTS });
		}
		const profileId = `${account}_${profileName}`;
		const profileExists = profilesAdapter.getSelectors().selectById(state.users.profiles, profileId);
		if (profileExists) {
			return rejectWithValue({ username: TEXT_CONSTANTS.ERRORS.PROFILE_ALREADY_EXISTS });
		}
		return { login: account, profile: profileName };
	}
);

export const removeProfileAsync = createAsyncThunk(
	'users/removeProfileAsync',
	async ({ account, profile }: { account: string; profile: string }, { dispatch }) => {
		const profileId = `${account}_${profile}`;
		dispatch(usersSlice.actions.updateProfile({
			id: profileId,
			changes: { favorites: [] }
		}));
		dispatch(usersSlice.actions.removeProfile({ account, profile }));
		dispatch(usersSlice.actions.closeModal());
	}
);

export const deleteAccountAsync = createAsyncThunk(
	'users/deleteAccountAsync',
	async ({ login }: { login: string }, { dispatch }) => {
		dispatch(usersSlice.actions.deleteAccount({ login }));
		dispatch(usersSlice.actions.closeModal());
	}
);

export const usersSlice = createSlice({
	name: 'users',
	initialState,
	reducers: {
		loginAccount: (state, action: PayloadAction<{ login: string }>) => {
			const { login } = action.payload;
			if (!accountsAdapter.getSelectors().selectById(state.accounts, login)) return;

			state.currentAccountId = login;
			const firstProfile = Object.values(state.profiles.entities).find(
				(p) => p?.accountId === login
			);
			state.currentProfileId = firstProfile?.id || null;
		},
		logoutAccount: (state) => {
			state.currentAccountId = null;
			state.currentProfileId = null;
		},
		addProfile: (state, action: PayloadAction<{ account: string; profile: string }>) => {
			const { account, profile } = action.payload;
			const profileId = `${account}_${profile}`;
			if (profilesAdapter.getSelectors().selectById(state.profiles, profileId)) return;

			profilesAdapter.addOne(state.profiles, {
				id: profileId,
				accountId: account,
				name: profile,
				favorites: []
			});

			state.currentProfileId = profileId;
		},
		switchProfile: (state, action: PayloadAction<{ account: string; profile: string }>) => {
			const profileId = `${action.payload.account}_${action.payload.profile}`;
			if (profilesAdapter.getSelectors().selectById(state.profiles, profileId)) {
				state.currentProfileId = profileId;
			}
		},
		removeProfile: (state, action: PayloadAction<{ account: string; profile: string }>) => {
			if (action.payload.profile === TEXT_CONSTANTS.COMMON.MAIN_PROFILE_NAME) return;

			const profileId = `${action.payload.account}_${action.payload.profile}`;
			profilesAdapter.removeOne(state.profiles, profileId);

			if (state.currentProfileId === profileId) {
				const remaining = Object.values(state.profiles.entities).find(
					(p) => p?.accountId === action.payload.account
				);
				state.currentProfileId = remaining?.id || null;
			}
		},
		toggleFavorite: (
			state,
			action: PayloadAction<{ account: string; profile: string; movie: Movie }>
		) => {
			const { account, profile, movie } = action.payload;
			const profileId = `${account}_${profile}`;
			const prof = state.profiles.entities[profileId];
			if (!prof) return;

			const exists = prof.favorites.some((m) => m.id === movie.id);
			prof.favorites = exists
				? prof.favorites.filter((m) => m.id !== movie.id)
				: [...prof.favorites, movie];
		},
		deleteAccount: (state, action: PayloadAction<{ login: string }>) => {
			const { login } = action.payload;
			accountsAdapter.removeOne(state.accounts, login);

			const profilesToRemove = Object.keys(state.profiles.entities).filter((id) =>
				id.startsWith(`${login}_`)
			);
			profilesAdapter.removeMany(state.profiles, profilesToRemove);

			if (state.currentAccountId === login) {
				state.currentAccountId = null;
				state.currentProfileId = null;
			}
		},
		updateProfile: (
			state,
			action: PayloadAction<{ id: string; changes: Partial<ExtendedProfile> }>
		) => {
			profilesAdapter.updateOne(state.profiles, action.payload);
		},
		openModal: (
			state,
			action: PayloadAction<{
        modalType: ModalState['modalType'];
        metadata?: { account: string; profile?: string };
      }>
		) => {
			state.modal = {
				isOpen: true,
				modalType: action.payload.modalType,
				metadata: action.payload.metadata
			};
		},
		closeModal: (state) => {
			state.modal.isOpen = false;
			state.modal.modalType = null;
			state.modal.metadata = undefined;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(loginAsync.pending, (state) => {
				state.loading = LoadingType.LOGIN;
				state.error = null;
			})
			.addCase(loginAsync.fulfilled, (state, action) => {
				state.loading = LoadingType.NONE;
				const { login, profile } = action.payload;
				const profileId = `${login}_${profile}`;
				state.currentAccountId = login;
				state.currentProfileId = profileId;
			})
			.addCase(loginAsync.rejected, (state, action) => {
				state.loading = LoadingType.NONE;
				state.error = action.payload?.username || action.payload?.password || TEXT_CONSTANTS.ERRORS.UNKNOWN;
			})
			.addCase(registerAsync.pending, (state) => {
				state.loading = LoadingType.LOGIN;
				state.error = null;
			})
			.addCase(registerAsync.fulfilled, (state, action) => {
				state.loading = LoadingType.NONE;
				const { login, profile, hashedPassword } = action.payload;
				accountsAdapter.addOne(state.accounts, {
					login,
					password: hashedPassword,
					profiles: []
				});
				const profileId = `${login}_${profile}`;
				profilesAdapter.addOne(state.profiles, {
					id: profileId,
					accountId: login,
					name: profile,
					favorites: []
				});
				state.currentAccountId = login;
				state.currentProfileId = profileId;
			})
			.addCase(registerAsync.rejected, (state, action) => {
				state.loading = LoadingType.NONE;
				state.error = action.payload?.username || action.payload?.password || TEXT_CONSTANTS.ERRORS.UNKNOWN;
			})
			.addCase(addProfileAsync.pending, (state) => {
				state.loading = LoadingType.LOGIN;
				state.error = null;
			})
			.addCase(addProfileAsync.fulfilled, (state, action) => {
				state.loading = LoadingType.NONE;
				const { login, profile } = action.payload;
				const profileId = `${login}_${profile}`;
				profilesAdapter.addOne(state.profiles, {
					id: profileId,
					accountId: login,
					name: profile,
					favorites: []
				});
				state.currentProfileId = profileId;
			})
			.addCase(addProfileAsync.rejected, (state, action) => {
				state.loading = LoadingType.NONE;
				state.error = action.payload?.username || TEXT_CONSTANTS.ERRORS.UNKNOWN;
			})
			.addCase(removeProfileAsync.pending, (state) => {
				state.loading = LoadingType.REMOVE_PROFILE;
				state.error = null;
			})
			.addCase(removeProfileAsync.fulfilled, (state) => {
				state.loading = LoadingType.NONE;
			})
			.addCase(removeProfileAsync.rejected, (state) => {
				state.loading = LoadingType.NONE;
				state.error = TEXT_CONSTANTS.ERRORS.REMOVE_PROFILE_FAILED;
			})
			.addCase(deleteAccountAsync.pending, (state) => {
				state.loading = LoadingType.DELETE_ACCOUNT;
				state.error = null;
			})
			.addCase(deleteAccountAsync.fulfilled, (state) => {
				state.loading = LoadingType.NONE;
			})
			.addCase(deleteAccountAsync.rejected, (state) => {
				state.loading = LoadingType.NONE;
				state.error = TEXT_CONSTANTS.ERRORS.DELETE_ACCOUNT_FAILED;
			});
	}
});

export const {
	loginAccount,
	logoutAccount,
	addProfile,
	switchProfile,
	toggleFavorite,
	openModal,
	closeModal,
	updateProfile,
	removeProfile,
	deleteAccount
} = usersSlice.actions;

export default usersSlice.reducer;