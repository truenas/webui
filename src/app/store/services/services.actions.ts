import { createAction, props } from '@ngrx/store';
import { ServiceName } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';

export const servicesLoaded = createAction(
  '[Services API] Services Loaded',
  props<{ services: Service[] }>(),
);

export const serviceChanged = createAction(
  '[Services API] Service Changed',
  props<{ service: Service }>(),
);

export const checkIfServiceIsEnabled = createAction(
  '[Services API] Check If Service Is Enabled',
  props<{ serviceName: ServiceName }>(),
);

export const serviceEnabled = createAction('[Services API] Service Enabled');
export const serviceDisabled = createAction('[Services API] Service Disabled');
export const serviceStarted = createAction('[Services API] Service Started');
export const serviceStartFailed = createAction('[Services API] Service Start Failed');
