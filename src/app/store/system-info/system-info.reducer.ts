import { createReducer, on } from '@ngrx/store';
import { environment } from 'environments/environment';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import {
  ixHardwareLoaded, systemInfoLoaded,
  productTypeLoaded,
} from 'app/store/system-info/system-info.actions';

export interface SystemInfoState {
  systemInfo: SystemInfo;
  productType: ProductType;
  isIxHardware: boolean;
  buildYear: number;
}

const initialState: SystemInfoState = {
  systemInfo: null,
  productType: ProductType.Scale,
  isIxHardware: false,
  buildYear: environment.buildYear,
};

export const systemInfoReducer = createReducer(
  initialState,
  on(systemInfoLoaded, (state, { systemInfo }) => ({ ...state, systemInfo })),
  on(productTypeLoaded, (state, { productType }) => ({ ...state, productType })),
  on(ixHardwareLoaded, (state, { isIxHardware }) => ({ ...state, isIxHardware })),
);
