import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconHarness } from '@angular/material/icon/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import {
  DirectoryServicesIndicatorComponent,
} from 'app/modules/layout/topbar/directory-services-indicator/directory-services-indicator.component';
import {
  DirectoryServicesMonitorComponent,
} from 'app/modules/layout/topbar/directory-services-indicator/directory-services-monitor/directory-services-monitor.component';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { ApiService } from 'app/modules/websocket/api.service';

describe('DirectoryServicesIndicatorComponent', () => {
  let spectator: Spectator<DirectoryServicesIndicatorComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DirectoryServicesIndicatorComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('directoryservices.status', {
          type: DirectoryServiceType.ActiveDirectory,
          status: DirectoryServiceStatus.Healthy,
          status_msg: 'Healthy',
        }),
      ]),
      mockProvider(MatDialog),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads directory services state and shows an icon if one of the services is enabled', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('directoryservices.status');

    const iconButton = await loader.getHarness(MatButtonHarness);
    await iconButton.click();
    const icon = await iconButton.getHarness(MatIconHarness);
    expect(await icon.getName()).toBe('info');
  });

  it('opens DirectoryServicesMonitorComponent when icon is pressed', async () => {
    const iconButton = await loader.getHarness(MatButtonHarness);
    await iconButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DirectoryServicesMonitorComponent, {
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: topbarDialogPosition,
    });
  });

  it(`subscribes to directory services status updates and updates icon visibility
    when status changes to at least one of the services enabled`, () => {
    const icon = spectator.query('button');
    expect(icon).toExist();

    const websocketMock = spectator.inject(MockApiService);
    websocketMock.subscribe.mockImplementation(() => of({
      id: '',
      collection: 'directoryservices.status',
      msg: CollectionChangeType.Changed,
      fields: {
        status: DirectoryServiceStatus.Disabled,
        type: DirectoryServiceType.ActiveDirectory,
        status_msg: 'Disabled',
      } as DirectoryServicesStatus,
    }));
    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.query('button')).not.toExist();
  });
});
