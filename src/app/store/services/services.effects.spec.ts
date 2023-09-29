import { MatDialog } from '@angular/material/dialog';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Service } from 'app/interfaces/service.interface';
import { StartServiceDialogComponent } from 'app/pages/sharing/components/start-service-dialog/start-service-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { checkIfServiceIsEnabled, serviceChanged, serviceEnabled, serviceRestart, servicesLoaded } from 'app/store/services/services.actions';
import { ServicesEffects } from 'app/store/services/services.effects';
import { initialState } from 'app/store/services/services.reducer';
import { selectService, selectServices } from 'app/store/services/services.selectors';

const cifsService = {
  id: 4,
  service: ServiceName.Cifs,
  enable: false,
  state: ServiceStatus.Stopped,
} as Service;

describe('ServicesEffects', () => {
  let spectator: SpectatorService<ServicesEffects>;
  let ws: WebSocketService;

  const actions$ = new ReplaySubject<unknown>(1);
  const createService = createServiceFactory({
    service: ServicesEffects,
    providers: [
      provideMockActions(() => actions$),
      mockWebsocket([
        mockCall('service.query', [cifsService]),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
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
          {
            selector: selectService(ServiceName.Cifs),
            value: cifsService,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    ws = spectator.inject(WebSocketService);
  });

  describe('loadServices$', () => {
    it('loads services and dispatches servicesLoaded()', async () => {
      actions$.next(adminUiInitialized());

      const dispatchedAction = await firstValueFrom(spectator.service.loadServices$);
      expect(dispatchedAction).toEqual(servicesLoaded({ services: [cifsService] }));
    });

    it('should handle errors when loading services', () => {
      const error = new Error('Service loading error');
      jest.spyOn(ws, 'call').mockReturnValue(throwError(() => error));

      actions$.next(adminUiInitialized());

      spectator.service.loadServices$.subscribe({
        error: (err) => {
          expect(err).toEqual(error);
        },
      });
    });
  });

  describe('subscribeToUpdates$', () => {
    it('should subscribe to service updates', async () => {
      jest.spyOn(ws, 'subscribe').mockImplementation((method) => {
        if (method == 'service.query') {
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
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('shows dialog when checkIfServiceIsEnabled is dispatched and service is stopped', async () => {
      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));

      const dispatchedAction = await firstValueFrom(spectator.service.checkIfServiceIsEnabled$);
      expect(dispatchedAction).toEqual(serviceEnabled());

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(StartServiceDialogComponent, {
        data: ServiceName.Cifs,
        disableClose: true,
      });
    });

    it('do not shows dialog when checkIfServiceIsEnabled is dispatched and service is running', async () => {
      const service = {
        ...cifsService,
        enable: true,
        state: ServiceStatus.Running,
      };
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectServices, [service]);
      actions$.next(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));

      const dispatchedAction = await firstValueFrom(spectator.service.checkIfServiceIsEnabled$);
      expect(dispatchedAction).toEqual(serviceRestart({ service }));

      expect(spectator.inject(MatDialog).open).not.toHaveBeenCalledWith(StartServiceDialogComponent, {
        data: ServiceName.Cifs,
        disableClose: true,
      });
    });
  });
});

