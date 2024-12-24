import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { serviceNames } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';
import { serviceChanged, servicesLoaded } from 'app/store/services/services.actions';

export interface ServicesState extends EntityState<Service> {
  areLoaded: boolean;
}

export const adapter = createEntityAdapter<Service>({
  selectId: (service) => service.id,
  sortComparer: (a, b) => {
    const aName = serviceNames.get(a.service);
    const bName = serviceNames.get(b.service);

    if (!aName || !bName) {
      return a.service.localeCompare(b.service);
    }
    return aName.localeCompare(bName);
  },
});

export const initialState: ServicesState = adapter.getInitialState({
  areLoaded: false,
});

export const servicesReducer = createReducer(
  initialState,

  on(servicesLoaded, (state, { services }) => adapter.setAll(services, { ...state, areLoaded: true })),
  on(serviceChanged, (state, { service }) => adapter.updateOne({
    id: service.id,
    changes: service,
  }, state)),
);
