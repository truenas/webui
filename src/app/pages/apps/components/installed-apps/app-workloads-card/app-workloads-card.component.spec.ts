import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import {
  createComponentFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App, AppContainerState } from 'app/interfaces/app.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { AppWorkloadsCardComponent } from 'app/pages/apps/components/installed-apps/app-workloads-card/app-workloads-card.component';
import {
  VolumeMountsDialog,
} from 'app/pages/apps/components/installed-apps/app-workloads-card/volume-mounts-dialog/volume-mounts-dialog.component';

describe('AppContainersCardComponent', () => {
  let spectator: Spectator<AppWorkloadsCardComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'ix-test-app',
    name: 'ix-test-app',
    metadata: { train: 'ix-test-train' },
    upgrade_available: true,
    state: AppState.Running,
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
      MockComponent(VolumeMountsDialog),
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

    expect(details[0].querySelector('.label')).toHaveText('Ports');
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
    expect(containers[0].querySelectorAll('.container-action > *')).toHaveLength(3);
  });

  it('opens volume mounts dialog when Volume Mounts button is pressed', async () => {
    const volumeButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Volume Mounts"]' }));
    await volumeButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(VolumeMountsDialog, {
      data: app.active_workloads.container_details[0],
      minWidth: '60vw',
    });
  });

  it('has a Shell button that links to shell page', async () => {
    const shellButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Shell"]' }));

    const host = await shellButton.host();
    expect(await host.getAttribute('href')).toBe('/apps/installed/ix-test-train/ix-test-app/shell/1');
  });

  it('has a View Logs button that links to logs page', async () => {
    const showLogsButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="View Logs"]' }));

    const host = await showLogsButton.host();
    expect(await host.getAttribute('href')).toBe('/apps/installed/ix-test-train/ix-test-app/logs/1');
  });

  describe('without web_shell access', () => {
    const createDeniedComponent = createComponentFactory({
      component: AppWorkloadsCardComponent,
      declarations: [
        MockComponent(VolumeMountsDialog),
      ],
      imports: [
        MapValuePipe,
      ],
      providers: [
        mockProvider(MatDialog, {
          open: jest.fn(() => of(true)),
        }),
        mockAuth({
          privilege: { roles: { $set: [Role.AppsWrite] }, web_shell: false },
        } as LoggedInUser),
      ],
    });

    it('shows the Shell button disabled with a lock icon and names web_shell as the reason', async () => {
      spectator = createDeniedComponent({ props: { app } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const shellButton = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Your user permissions do not allow Web Shell access."]' }),
      );

      expect(await shellButton.isDisabled()).toBe(true);
      expect(await loader.getHarnessOrNull(TnIconHarness.with({ name: 'lock' }))).not.toBeNull();
      expect(await loader.getHarnessOrNull(TnIconHarness.with({ name: 'console' }))).toBeNull();
    });
  });

  // MockAuthService.hasRole() always resolves true, so mock AuthService directly to
  // exercise the has-web_shell-but-not-apps-write path the distinguished message targets.
  describe('without apps-write role', () => {
    const createDeniedComponent = createComponentFactory({
      component: AppWorkloadsCardComponent,
      declarations: [
        MockComponent(VolumeMountsDialog),
      ],
      imports: [
        MapValuePipe,
      ],
      providers: [
        mockProvider(MatDialog, {
          open: jest.fn(() => of(true)),
        }),
        mockProvider(AuthService, {
          hasRole: () => of(false),
          hasWebShellAccess$: of(true),
        }),
      ],
    });

    it('locks the Shell button and names the missing role, not web_shell', () => {
      spectator = createDeniedComponent({ props: { app } });

      expect(spectator.query('a[aria-label="You do not have permission to open this shell."]')).toExist();
    });
  });
});
