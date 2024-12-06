import { MatDialog } from '@angular/material/dialog';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  BehaviorSubject, firstValueFrom, of, ReplaySubject, throwError,
} from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Service } from 'app/interfaces/service.interface';
import { StartServiceDialogComponent, StartServiceDialogResult } from 'app/modules/dialog/components/start-service-dialog/start-service-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/services/websocket/api.service';
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
  let api: ApiService;
  let store$: MockStore<ServicesState>;

  const afterClosed$ = new BehaviorSubject<StartServiceDialogResult>({
    start: true,
    startAutomatically: true,
  });
  const actions$ = new ReplaySubject<unknown>(1);
  const createService = createServiceFactory({
    service: ServicesEffects,
    providers: [
      provideMockActions(() => actions$),
      mockApi([
        mockCall('service.query', [cifsService]),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => afterClosed$,
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
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
    api = spectator.inject(ApiService);
    store$ = spectator.inject(MockStore);
  });

  describe('loadServices$', () => {
    it('loads services and dispatches servicesLoaded()', async () => {
      actions$.next(adminUiInitialized());

      const dispatchedAction = await firstValueFrom(spectator.service.loadServices$);
      expect(dispatchedAction).toEqual(servicesLoaded({ services: [cifsService] }));
    });

    it('should handle errors when loading services', () => {
      jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Service loading error');
      jest.spyOn(api, 'call').mockReturnValue(throwError(() => error));

      actions$.next(adminUiInitialized());

      spectator.service.loadServices$.subscribe({
        error: (err: unknown) => {
          expect(err).toEqual(error);
        },
      });
    });
  });

  describe('subscribeToUpdates$', () => {
    it('should subscribe to service updates', async () => {
      jest.spyOn(api, 'subscribe').mockImplementation((method) => {
        if (method === 'service.query') {
          return of({ fields: { ...cifsService, state: ServiceStatus.Running } } as ApiEvent<Service>);
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
  });

  describe('checkIfServiceIsEnabled$', () => {
    it('shows dialog when service is stopped and not set to start automatically.', async () => {
      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));

      const dispatchedAction = await firstValueFrom(spectator.service.checkIfServiceIsEnabled$);
      expect(dispatchedAction).toEqual(serviceEnabled());

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(StartServiceDialogComponent, {
        data: ServiceName.Cifs,
        disableClose: true,
      });
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
      afterClosed$.next({ start: true, startAutomatically: false });

      const dispatchedAction = await firstValueFrom(spectator.service.checkIfServiceIsEnabled$);
      expect(dispatchedAction).toEqual(serviceStarted());

      expect(spectator.inject(MatDialog).open).not.toHaveBeenCalledWith(StartServiceDialogComponent, {
        data: ServiceName.Cifs,
        disableClose: true,
      });
    });

    it('shows dialog when service is stopped twice', async () => {
      store$.overrideSelector(selectServices, [{
        ...cifsService,
        enable: false,
        state: ServiceStatus.Stopped,
      }]);
      store$.refreshState();

      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
      afterClosed$.next({ start: true, startAutomatically: false });

      expect(await firstValueFrom(spectator.service.checkIfServiceIsEnabled$)).toEqual(serviceStarted());

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(StartServiceDialogComponent, {
        data: ServiceName.Cifs,
        disableClose: true,
      });

      store$.overrideSelector(selectServices, [{
        ...cifsService,
        enable: false,
        state: ServiceStatus.Stopped,
      }]);
      store$.refreshState();

      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
      afterClosed$.next({ start: true, startAutomatically: false });

      expect(await firstValueFrom(spectator.service.checkIfServiceIsEnabled$)).toEqual(serviceStarted());

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(StartServiceDialogComponent, {
        data: ServiceName.Cifs,
        disableClose: true,
      });
      expect(spectator.inject(MatDialog).open).toHaveBeenCalledTimes(2);
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

      expect(spectator.inject(MatDialog).open).not.toHaveBeenCalledWith(StartServiceDialogComponent, {
        data: ServiceName.Cifs,
        disableClose: true,
      });
    });
  });
});
