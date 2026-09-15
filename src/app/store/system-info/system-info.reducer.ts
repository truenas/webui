import { createReducer, on } from '@ngrx/store';
import { environment } from 'environments/environment';
import { EntitlementFacts } from 'app/interfaces/entitlement.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  ixHardwareLoaded, systemInfoLoaded,
  entitlementFactsLoaded,
} from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo | null;
  entitlementFacts: EntitlementFacts | null;
  isIxHardware: boolean;
  buildYear: number;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  entitlementFacts: null,
  isIxHardware: false,
  buildYear: environment.buildYear,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(entitlementFactsLoaded, (state, { entitlementFacts }) => ({ ...state, entitlementFacts })),
  on(ixHardwareLoaded, (state, { isIxHardware }) => ({ ...state, isIxHardware })),
);
