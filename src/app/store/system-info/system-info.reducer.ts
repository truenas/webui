import { createReducer, on } from '@ngrx/store';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  ixHardwareLoaded, systemFeaturesLoaded, systemHostIdLoaded, systemInfoLoaded, systemIsStableLoaded,
  productTypeLoaded,
} from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  systemFeatures: SystemFeatures;
  systemHostId: string;
  systemIsStable: boolean;
  productType: ProductType;
  isIxHardware: boolean;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  systemFeatures: null,
  systemHostId: null,
  productType: null,
  systemIsStable: false,
  isIxHardware: false,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(systemFeaturesLoaded, (state, { systemFeatures }) => ({ ...state, systemFeatures })),
  on(systemHostIdLoaded, (state, { systemHostId }) => ({ ...state, systemHostId })),
  on(systemIsStableLoaded, (state, { systemIsStable }) => ({ ...state, systemIsStable })),
  on(productTypeLoaded, (state, { productType }) => ({ ...state, productType })),
  on(ixHardwareLoaded, (state, { isIxHardware }) => ({ ...state, isIxHardware })),
);
