import { createAction, props } from '@ngrx/store';
import { ServiceName } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';

export const servicesLoaded = createAction(
  '[Services API] Services Loaded',
  props<{ services: Service[] }>(),
);

export const serviceChanged = createAction(
  '[Services API] Service State Updated',
  props<{ service: Service }>(),
);

export const checkIfServiceIsEnabled = createAction(
  '[Services API] Check If Service Is Enabled',
  props<{ serviceName: ServiceName }>(),
);

export const serviceEnabled = createAction('[Services API] Service Enabled');
export const serviceStartFailed = createAction('[Services API] Service Start Failed');
export const serviceRestart = createAction('[Services API] Service Restart', props<{ service: Service }>());
