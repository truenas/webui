import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CatalogAppState } from 'app/enums/catalog-app-state.enum';
import { App, AppContainerState } from 'app/interfaces/app.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppWorkloadsCardComponent } from 'app/pages/apps/components/installed-apps/app-workloads-card/app-workloads-card.component';
import {
  VolumeMountsDialogComponent,
} from 'app/pages/apps/components/installed-apps/app-workloads-card/volume-mounts-dialog/volume-mounts-dialog.component';

describe('AppContainersCardComponent', () => {
  let spectator: Spectator<AppWorkloadsCardComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'ix-test-app',
    name: 'ix-test-app',
    upgrade_available: true,
    state: CatalogAppState.Running,
    active_workloads:
      {
        containers: 1,
        used_ports: [
          {
            container_port: '20489',
            protocol: 'tcp',
            host_ports: [
              { host_port: '20489', host_ip: '0.0.0.0' },
            ],
          },
          {
            container_port: '80',
            protocol: 'tcp',
            host_ports: [
              { host_port: '8080', host_ip: '0.0.0.0' },
            ],
          },
        ],
        container_details: [
          {
            id: '1',
            service_name: 'netdata',
            image: 'netdata/netdata:v1.46.1',
            port_config: [],
            state: AppContainerState.Running,
            volume_mounts: [
              {
                source: '/etc/group',
                destination: '/host/etc/group',
                mode: '',
                type: 'bind',
              },
            ],
          },
        ],
      },
  } as App;

  const createComponent = createComponentFactory({
    component: AppWorkloadsCardComponent,
    declarations: [
      MockComponent(VolumeMountsDialogComponent),
    ],
    imports: [
      MapValuePipe,
    ],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Workloads');
  });

  it('shows number of ports', () => {
    const details = spectator.queryAll('.details-item');
    expect(details).toHaveLength(1);

    expect(details[0].querySelector('.label')).toHaveText('Ports:');
    expect(details[0].querySelector('.value')).toHaveText('tcp://0.0.0.0:20489:20489');
    expect(details[0].querySelector('.value')).toHaveText('tcp://0.0.0.0:8080:80');
  });

  it('shows container header and number of containers', () => {
    expect(spectator.query('.containers h4')).toHaveText('Containers');
  });

  it('shows container list', () => {
    const containers = spectator.queryAll('.container');
    expect(containers).toHaveLength(1);

    expect(containers[0].querySelector('.service-name')).toHaveText('netdata');
    expect(containers[0].querySelector('.container-state')).toHaveText('Running');
    expect(containers[0].querySelectorAll('.container-action button')).toHaveLength(1);
  });

  it('opens volume mounts dialog when Volume Mounts button is pressed', async () => {
    const volumeButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Volume Mounts"]' }));
    await volumeButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(VolumeMountsDialogComponent, {
      data: app.active_workloads.container_details[0],
    });
  });

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130392
  it.skip('opens shell app dialog when Shell button is pressed', async () => {
    const shellButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Shell"]' }));
    await shellButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(1);
  });

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130392
  it.skip('opens view logs dialog when View Logs button is pressed', async () => {
    const showLogsButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="View Logs"]' }));
    await showLogsButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(1);
  });
});
