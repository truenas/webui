import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import { ServiceName } from 'app/enums/service-name.enum';
import { selectNotNull } from 'app/helpers/operators/select-not-null.helper';
import { Service } from 'app/interfaces/service.interface';
import { ServicesState, adapter } from 'app/store/services/services.reducer';

export const servicesStateKey = 'services';

export const selectServicesState = createFeatureSelector<ServicesState>(servicesStateKey);

const { selectAll } = adapter.getSelectors();

export const selectServices = createSelector(
  selectServicesState,
  selectAll,
);

export const waitForServices = selectNotNull(selectServices);

export const selectService = (name: ServiceName): MemoizedSelector<object, Service | undefined> => createSelector(
  selectServices,
  (services) => services.find((service) => service.service === name),
);
