import { createAction, props } from '@ngrx/store';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';

export const systemConfigLoaded = createAction(
  '[System Config API] Loaded',
  props<{ generalConfig: SystemGeneralConfig; advancedConfig: AdvancedConfig }>(),
);

export const generalConfigUpdated = createAction('[System Config] General Config Updated');
export const advancedConfigUpdated = createAction('[System Config] Advanced Config Updated');
export const loginBannerUpdated = createAction('[System Config] Login Banner Updated', props<{ loginBanner: string }>());
