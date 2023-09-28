import { createAction, props } from '@ngrx/store';
import { Service } from 'app/interfaces/service.interface';

export const servicesLoaded = createAction(
  '[Services API] Services Loaded',
  props<{ services: Service[] }>(),
);

export const serviceChanged = createAction(
  '[Services API] Service State Updated',
  props<{ service: Service }>(),
);
