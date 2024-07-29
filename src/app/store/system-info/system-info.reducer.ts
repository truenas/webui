import { createReducer, on } from '@ngrx/store';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  ixHardwareLoaded, systemHostIdLoaded, systemInfoLoaded, systemIsStableLoaded,
  productTypeLoaded,
  systemBuildTimeLoaded,
} from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  systemHostId: string;
  systemIsStable: boolean;
  productType: ProductType;
  isIxHardware: boolean;
  buildTime: number;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  systemHostId: null,
  productType: null,
  systemIsStable: false,
  isIxHardware: false,
  buildTime: null,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(systemHostIdLoaded, (state, { systemHostId }) => ({ ...state, systemHostId })),
  on(systemIsStableLoaded, (state, { systemIsStable }) => ({ ...state, systemIsStable })),
  on(systemBuildTimeLoaded, (state, { buildTime }) => ({ ...state, buildTime })),
  on(productTypeLoaded, (state, { productType }) => ({ ...state, productType })),
  on(ixHardwareLoaded, (state, { isIxHardware }) => ({ ...state, isIxHardware })),
);
