import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  BehaviorSubject, firstValueFrom, of, ReplaySubject, throwError,
} from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Service } from 'app/interfaces/service.interface';
import { StartServiceDialogResult } from 'app/modules/dialog/components/start-service-dialog/start-service-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  checkIfServiceIsEnabled, serviceChanged, serviceEnabled, servicesLoaded, serviceStarted,
} from 'app/store/services/services.actions';
import { ServicesEffects } from 'app/store/services/services.effects';
import { initialState, ServicesState } from 'app/store/services/services.reducer';
import { selectServices } from 'app/store/services/services.selectors';

const cifsService = {
  id: 4,
  service: ServiceName.Cifs,
  enable: false,
  state: ServiceStatus.Stopped,
} as Service;

describe('ServicesEffects', () => {
  let spectator: SpectatorService<ServicesEffects>;
  let api: TypedApiService;
  let store$: MockStore<ServicesState>;

  const closed$ = new BehaviorSubject<StartServiceDialogResult>({
    start: true,
    startAutomatically: true,
  });
  const actions$ = new ReplaySubject<unknown>(1);
  const createService = createServiceFactory({
    service: ServicesEffects,
    providers: [
      provideMockActions(() => actions$),
      mockTypedApi([
        mockTypedQuery('service.query', [cifsService]),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        startService: jest.fn(() => closed$),
      }),
      provideMockStore({
        initialState,
        selectors: [
          {
            selector: selectServices,
            value: [cifsService],
          },
        ],
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(TypedApiService);
    store$ = spectator.inject(MockStore);
  });

  describe('loadServices$', () => {
    it('loads services and dispatches servicesLoaded()', async () => {
      actions$.next(adminUiInitialized());

      const dispatchedAction = await firstValueFrom(spectator.service.loadServices$);
      expect(dispatchedAction).toEqual(servicesLoaded({ services: [cifsService] }));
    });

    it('logs and swallows an error when loading services', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Service loading error');
      jest.spyOn(api, 'query').mockReturnValue(throwError(() => error));

      actions$.next(adminUiInitialized());

      const dispatched: unknown[] = [];
      spectator.service.loadServices$.subscribe((action) => dispatched.push(action));

      expect(dispatched).toEqual([]);
      expect(consoleError).toHaveBeenCalledWith(error);
    });
  });

  describe('subscribeToUpdates$', () => {
    it('should subscribe to service updates', async () => {
      jest.spyOn(api, 'subscribe').mockImplementation((method) => {
        if (method === 'service.query') {
          return of({
            msg: CollectionChangeType.Changed,
            fields: { ...cifsService, state: ServiceStatus.Running },
          } as ApiEvent<Service>);
        }
        return of();
      });

      actions$.next(servicesLoaded({ services: [cifsService] }));

      const dispatchedAction = await firstValueFrom(spectator.service.subscribeToUpdates$);
      expect(dispatchedAction).toEqual(
        serviceChanged({
          service: {
            ...cifsService,
            state: ServiceStatus.Running,
          },
        }),
      );
    });

    it('ignores a removal, which carries no service to update', () => {
      jest.spyOn(api, 'subscribe').mockReturnValue(
        of({ msg: CollectionChangeType.Removed, id: cifsService.id } as ApiEvent<Service>),
      );

      actions$.next(servicesLoaded({ services: [cifsService] }));

      const dispatched: unknown[] = [];
      spectator.service.subscribeToUpdates$.subscribe((action) => dispatched.push(action));

      expect(dispatched).toEqual([]);
    });
  });

  describe('checkIfServiceIsEnabled$', () => {
    it('shows dialog when service is stopped and not set to start automatically.', async () => {
      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));

      const dispatchedAction = await firstValueFrom(spectator.service.checkIfServiceIsEnabled$);
      expect(dispatchedAction).toEqual(serviceEnabled());

      expect(spectator.inject(DialogService).startService).toHaveBeenCalledWith(ServiceName.Cifs);
    });

    it('do not shows dialog when service is running and not set to start automatically.', async () => {
      const service = {
        ...cifsService,
        enable: false,
        state: ServiceStatus.Running,
      };
      store$.overrideSelector(selectServices, [service]);
      store$.refreshState();

      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
      closed$.next({ start: true, startAutomatically: false });

      const dispatchedAction = await firstValueFrom(spectator.service.checkIfServiceIsEnabled$);
      expect(dispatchedAction).toEqual(serviceStarted());

      expect(spectator.inject(DialogService).startService).not.toHaveBeenCalled();
    });

    it('shows dialog when service is stopped twice', async () => {
      store$.overrideSelector(selectServices, [{
        ...cifsService,
        enable: false,
        state: ServiceStatus.Stopped,
      }]);
      store$.refreshState();

      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
      closed$.next({ start: true, startAutomatically: false });

      expect(await firstValueFrom(spectator.service.checkIfServiceIsEnabled$)).toEqual(serviceStarted());

      expect(spectator.inject(DialogService).startService).toHaveBeenCalledWith(ServiceName.Cifs);

      store$.overrideSelector(selectServices, [{
        ...cifsService,
        enable: false,
        state: ServiceStatus.Stopped,
      }]);
      store$.refreshState();

      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
      closed$.next({ start: true, startAutomatically: false });

      expect(await firstValueFrom(spectator.service.checkIfServiceIsEnabled$)).toEqual(serviceStarted());

      expect(spectator.inject(DialogService).startService).toHaveBeenCalledWith(ServiceName.Cifs);
      expect(spectator.inject(DialogService).startService).toHaveBeenCalledTimes(2);
    });

    it('do not shows dialog when service is running and started automatically.', async () => {
      const service = {
        ...cifsService,
        enable: true,
        state: ServiceStatus.Running,
      };
      store$.overrideSelector(selectServices, [service]);
      store$.refreshState();

      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));

      const dispatchedAction = await firstValueFrom(spectator.service.checkIfServiceIsEnabled$);
      expect(dispatchedAction).toEqual(serviceEnabled());

      expect(spectator.inject(DialogService).startService).not.toHaveBeenCalled();
    });
  });
});
