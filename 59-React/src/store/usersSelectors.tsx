import { createSelector } from 'reselect';
import { RootState } from './store';
import { profilesAdapter, accountsAdapter, LoadingType } from './usersSlice';

export const profilesSelectors = profilesAdapter.getSelectors<RootState>(
	(state) => state.users.profiles
);

export const accountsSelectors = accountsAdapter.getSelectors<RootState>(
	(state) => state.users.accounts
);

export const selectCurrentAccountId = (state: RootState) => state.users.currentAccountId;
export const selectCurrentProfileId = (state: RootState) => state.users.currentProfileId;

export const selectIsAuthenticated = createSelector(
	[accountsSelectors.selectEntities, selectCurrentAccountId],
	(entities, currentAccountId) => !!currentAccountId && !!entities[currentAccountId]
);

export const selectCurrentProfile = createSelector(
	[profilesSelectors.selectEntities, selectCurrentProfileId],
	(profiles, profileId) => (profileId ? profiles[profileId] : null)
);

export const selectCurrentAccount = createSelector(
	[accountsSelectors.selectEntities, selectCurrentAccountId],
	(entities, currentAccountId) => (currentAccountId ? entities[currentAccountId] : null)
);

export const selectCurrentProfileName = createSelector(
	[profilesSelectors.selectEntities, selectCurrentProfileId],
	(entities, profileId) => (profileId ? entities[profileId]?.name || '' : '')
);

export const selectIsUsersLoading = (state: RootState) => state.users.loading !== LoadingType.NONE;

export const makeSelectProfilesForAccount = (accountLogin?: string) => 
	createSelector(
		[profilesSelectors.selectAll],
		(profiles) => {
			if (!accountLogin) return [];
			return profiles.filter(profile => profile.accountId === accountLogin);
		}
	);

export const makeSelectFavoritesCount = (profileId?: string) =>
	createSelector(
		[profilesSelectors.selectEntities],
		(profiles) => {
			if (!profileId) return 0;
			return profiles[profileId]?.favorites?.length || 0;
		}
	);

export const selectUsersModal = (state: RootState) => state.users.modal;