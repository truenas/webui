import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import {
  DirectoryServicesMonitorComponent,
} from 'app/modules/layout/topbar/directory-services-indicator/directory-services-monitor/directory-services-monitor.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { ApiService } from 'app/modules/websocket/api.service';

describe('DirectoryServicesMonitorComponent', () => {
  let spectator: Spectator<DirectoryServicesMonitorComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DirectoryServicesMonitorComponent,
    imports: [
      MapValuePipe,
    ],
    providers: [
      mockApi([
        mockCall('directoryservices.status', {
          type: DirectoryServiceType.Ldap,
          status: DirectoryServiceStatus.Healthy,
          status_msg: 'Healthy',
        }),
      ]),
      {
        provide: MatDialogRef,
        useValue: {
          close: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads directory services status on component initialization', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('directoryservices.status');
  });

  it('shows status of a non-disabled directory service', () => {
    expect(spectator.query('.status-row')).toHaveText('ServiceLDAP');

    const statusIcon = spectator.query('.status-row .icon');
    expect(statusIcon).toHaveClass('state-healthy');
  });

  it('updates directory services status when refresh button is pressed', async () => {
    const refreshButton = await loader.getHarness(IxIconHarness.with({ name: 'refresh' }));
    await refreshButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('directoryservices.status');
  });
});
