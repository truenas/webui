import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
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
        mockCall('directoryservices.get_state', {
          activedirectory: DirectoryServiceState.Disabled,
          ldap: DirectoryServiceState.Healthy,
        }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads directory services status on component initialization', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('directoryservices.get_state');
  });

  it('shows status of a non-disabled directory service', () => {
    expect(spectator.query('.status-row')).toHaveText('LDAP Healthy');

    const statusIcon = spectator.query('.status-row .icon');
    expect(statusIcon).toHaveClass('state-healthy');
  });

  it('updates directory services status when refresh button is pressed', async () => {
    const refreshButton = await loader.getHarness(IxIconHarness.with({ name: 'refresh' }));
    await refreshButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('directoryservices.get_state');
  });
});
