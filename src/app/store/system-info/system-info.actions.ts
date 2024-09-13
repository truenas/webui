import { createAction, props } from '@ngrx/store';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';

export const systemInfoLoaded = createAction(
  '[System Info API] Info Loaded',
  props<{ systemInfo: SystemInfo }>(),
);

export const productTypeLoaded = createAction(
  '[System Info API] Product Type Loaded',
  props<{ productType: ProductType }>(),
);

export const ixHardwareLoaded = createAction(
  '[System Info API] System is IxHardware Loaded',
  props<{ isIxHardware: boolean }>(),
);

export const passiveNodeReplaced = createAction(
  '[System Info API] Passive Node Replaced',
);

export const systemInfoUpdated = createAction(
  '[System Info API] System Info Updated',
);
