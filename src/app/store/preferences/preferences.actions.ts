import { createAction, props } from '@ngrx/store';
import { DashConfigItem } from 'app/interfaces/dash-config-item.interface';
import { Preferences, TableDisplayedColumns } from 'app/interfaces/preferences.interface';

export const preferencesLoaded = createAction('[Preferences API] Loaded', props<{ preferences: Preferences }>());
export const noPreferencesFound = createAction('[Preferences API] No Preferences Found');

// TODO: These actions will be moved elsewhere in the future
export const themeNotFound = createAction('[Preferences] Theme Not Found');
export const preferredColumnsUpdated = createAction(
  '[Preferences] Preferred Columns Updated',
  props<{ columns: TableDisplayedColumns[] }>(),
);
export const shownNewIndicatorKeysUpdated = createAction(
  '[Preferences] Shown New Indicator Keys Updated',
  props<{ keys: string[] }>(),
);
export const localizationFormSubmitted = createAction('[Preferences] Localization Form Submitted', props<{
  dateFormat: string;
  timeFormat: string;
}>());
export const lifetimeTokenUpdated = createAction('[Preferences] Lifetime Token Updated', props<{ lifetime: number }>());

export const autoRefreshReportsToggled = createAction('[Preferences] Auto Refresh Reports Toggled');
export const builtinUsersToggled = createAction('[Preferences] Builtin Users Toggled');
export const builtinGroupsToggled = createAction('[Preferences] Builtin Groups Toggled');
export const snapshotExtraColumnsToggled = createAction('[Preferences] Snapshot Extra Columns Toggled');

export const themeChangedInGuiForm = createAction('[Preferences] Theme Changed In GUI Form', props<{ theme: string }>());
export const guiFormSubmitted = createAction('[Preferences] GUI Form Submitted', props<{ theme: string }>());
export const guiFormClosedWithoutSaving = createAction('[Preferences] GUI Form Closed Without Saving');

export const dashboardStateLoaded = createAction('[Preferences API] Dashboard State Loaded', props<{ dashboardState: DashConfigItem[] }>());
export const dashboardStateUpdated = createAction('[Preferences API] Dashboard State Updated', props<{ dashboardState: DashConfigItem[] }>());
export const noDashboardStateFound = createAction('[Preferences API] No Dashboard State Found');

export const updateRebootAfterManualUpdate = createAction(
  '[Preferences] Restart After Manual Update Option Updated',
  props<{ rebootAfterManualUpdate: boolean }>(),
);
