import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import {
  catchError, EMPTY, Observable, of, throwError,
} from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Job } from 'app/interfaces/job.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceStatusCellComponent } from 'app/pages/services/components/service-status-cell/service-status-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('ServiceStatusCellComponent', () => {
  let spectator: SpectatorHost<ServiceStatusCellComponent>;
  let loader: ReturnType<typeof TestbedHarnessEnvironment.loader>;
  let api: ApiService;

  const createHost = createHostFactory({
    component: ServiceStatusCellComponent,
    imports: [MapValuePipe],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('service.update', 1),
        mockJob('service.control', { state: JobState.Success, result: true }),
      ]),
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: <T>() => (source$: Observable<T>) => source$.pipe(catchError((error: unknown) => {
          spectator.inject(ErrorHandlerService).showErrorModal(error);
          return EMPTY;
        })),
      }),
    ],
    shallow: false,
  });

  function setupTest(service: Service): void {
    spectator = createHost(`
      <ix-service-status-cell [service]="service"></ix-service-status-cell>
    `, { hostProps: { service } });

    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('checks status for running service', () => {
    setupTest({ service: ServiceName.Ftp, state: ServiceStatus.Running } as Service);

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks status for stopped service', () => {
    setupTest({ service: ServiceName.Ftp, state: ServiceStatus.Stopped } as Service);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for deploying service', () => {
    setupTest({ service: ServiceName.Ftp, state: ServiceStatus.Stopped } as Service);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('shows "Start Service" icon when service is stopped', async () => {
    setupTest({ service: ServiceName.Ftp, state: ServiceStatus.Stopped } as Service);

    const startIcon = await loader.getHarness(TnIconHarness.with({ name: 'play-circle' }));
    expect(startIcon).toBeTruthy();

    await startIcon.click();

    expect(api.job).toHaveBeenCalledWith('service.control', [ServiceOperation.Start, ServiceName.Ftp, { silent: false }]);
  });

  it('shows "Stop Service" icon when service is running', async () => {
    setupTest({ service: ServiceName.Ftp, state: ServiceStatus.Running } as Service);

    const stopIcon = await loader.getHarness(TnIconHarness.with({ name: 'stop-circle' }));
    expect(stopIcon).toBeTruthy();

    await stopIcon.click();

    expect(api.job).toHaveBeenCalledWith('service.control', [ServiceOperation.Stop, ServiceName.Ftp, { silent: false }]);
  });

  describe('success message', () => {
    const cases = [
      {
        action: 'start', state: ServiceStatus.Stopped, icon: 'play-circle', message: 'Service started',
      },
      {
        action: 'stop', state: ServiceStatus.Running, icon: 'stop-circle', message: 'Service stopped',
      },
    ];

    async function clickIcon(icon: string): Promise<void> {
      await (await loader.getHarness(TnIconHarness.with({ name: icon }))).click();
      await spectator.fixture.whenStable();
    }

    cases.forEach(({
      action, state, icon, message,
    }) => describe(`${action} action`, () => {
      beforeEach(() => setupTest({ service: ServiceName.Ftp, state } as Service));

      it(`shows "${message}" when the ${action} job succeeds`, async () => {
        await clickIcon(icon);

        expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(message);
      });

      it(`shows the error and no success message when the ${action} job fails`, async () => {
        const errorHandler = spectator.inject(ErrorHandlerService);
        jest.spyOn(api, 'job').mockReturnValue(throwError(() => new Error('Refused')));

        await clickIcon(icon);

        expect(errorHandler.showErrorModal).toHaveBeenCalledWith(new Error('Refused'));
        expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
      });

      it(`shows no success message when the ${action} job finishes with result false`, async () => {
        jest.spyOn(api, 'job').mockReturnValue(
          of({ state: JobState.Success, result: false, time_finished: { $date: 1 } } as Job<boolean>),
        );

        await clickIcon(icon);

        expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
      });
    }));
  });
});
