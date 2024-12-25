import { createReducer, on } from '@ngrx/store';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { systemConfigLoaded } from 'app/store/system-config/system-config.actions';

export interface SystemConfigState {
  generalConfig: SystemGeneralConfig | null;
  advancedConfig: AdvancedConfig | null;
}

const initialState: SystemConfigState = {
  generalConfig: null,
  advancedConfig: null,
};

export const systemConfigReducer = createReducer(
  initialState,

  on(systemConfigLoaded, (state, { generalConfig, advancedConfig }) => ({ ...state, generalConfig, advancedConfig })),
);
