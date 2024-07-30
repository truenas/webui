import { createReducer, on } from '@ngrx/store';
import { environment } from 'environments/environment';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  ixHardwareLoaded, systemHostIdLoaded, systemInfoLoaded, systemIsStableLoaded,
  productTypeLoaded,
} from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  systemHostId: string;
  systemIsStable: boolean;
  productType: ProductType;
  isIxHardware: boolean;
  buildYear: number;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  systemHostId: null,
  productType: null,
  systemIsStable: false,
  isIxHardware: false,
  buildYear: environment.buildYear,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(systemHostIdLoaded, (state, { systemHostId }) => ({ ...state, systemHostId })),
  on(systemIsStableLoaded, (state, { systemIsStable }) => ({ ...state, systemIsStable })),
  on(productTypeLoaded, (state, { productType }) => ({ ...state, productType })),
  on(ixHardwareLoaded, (state, { isIxHardware }) => ({ ...state, isIxHardware })),
);
