import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceStatusCellComponent } from 'app/pages/services/components/service-status-cell/service-status-cell.component';

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
        mockJob('service.control', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
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

    const startIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
    expect(startIcon).toBeTruthy();

    await startIcon.click();

    expect(api.job).toHaveBeenCalledWith('service.control', [ServiceOperation.Start, ServiceName.Ftp, { silent: false }]);
  });

  it('shows "Stop Service" icon when service is running', async () => {
    setupTest({ service: ServiceName.Ftp, state: ServiceStatus.Running } as Service);

    const stopIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
    expect(stopIcon).toBeTruthy();

    await stopIcon.click();

    expect(api.job).toHaveBeenCalledWith('service.control', [ServiceOperation.Stop, ServiceName.Ftp]);
  });
});
