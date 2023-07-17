import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartContainerImage, ChartRelease } from 'app/interfaces/chart-release.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppContainersCardComponent } from './app-containers-card.component';

describe('AppContainersCardComponent', () => {
  let spectator: Spectator<AppContainersCardComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'ix-test-app',
    name: 'ix-test-app',
    update_available: true,
    status: ChartReleaseStatus.Active,
    used_ports: [{
      port: 22, protocol: 'TCP',
    }, {
      port: 44, protocol: 'TCP',
    }, {
      port: 66, protocol: 'UDP',
    }],
    resources: {
      container_images: {
        'docker.io/ix-test-app': {
          id: 'sha256:test',
          update_available: false,
        },
        'docker.io/ix-test-dependency-app': {
          id: 'sha256:test',
          update_available: true,
        },
      } as {
        [key: string]: ChartContainerImage;
      },
      deployments: [{}, {}],
      pods: [{}],
      statefulsets: [{}],
    },
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppContainersCardComponent,
    declarations: [
      MockComponent(NgxSkeletonLoaderComponent),
    ],
    providers: [
      mockProvider(ApplicationsService, {
        getChartReleaseWithResources: jest.fn(() => of([app])),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => of(true)),
      }),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Workloads');
  });

  it('shows details', () => {
    const details = spectator.queryAll('.details-item');
    expect(details).toHaveLength(4);

    expect(details[0].querySelector('.label')).toHaveText('Pods:');
    expect(details[0].querySelector('.value')).toHaveText('1');

    expect(details[1].querySelector('.label')).toHaveText('Used Ports:');
    expect(details[1].querySelector('.value')).toHaveText('22\\TCP, 44\\TCP, 66\\UDP');

    expect(details[2].querySelector('.label')).toHaveText('Deployments:');
    expect(details[2].querySelector('.value')).toHaveText('2');

    expect(details[3].querySelector('.label')).toHaveText('Stateful Sets:');
    expect(details[3].querySelector('.value')).toHaveText('1');
  });

  it('shows container list', () => {
    expect(spectator.query('.containers h4')).toHaveText('Containers');

    const containers = spectator.queryAll('.container-item');
    expect(containers).toHaveLength(2);

    expect(containers[0].querySelector('.container-name')).toHaveText('docker.io/ix-test-app');
    expect(containers[0].querySelector('.container-status')).toHaveText('Up to date');
    expect(containers[0].querySelectorAll('.container-action button')).toHaveLength(2);

    expect(containers[1].querySelector('.container-name')).toHaveText('docker.io/ix-test-dependency-app');
    expect(containers[1].querySelector('.container-status')).toHaveText('Update available');
    expect(containers[1].querySelectorAll('.container-action button')).toHaveLength(2);
  });

  it('opens shell app dialog when Shell button is pressed', async () => {
    const shellButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Shell"]' }));
    await shellButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledTimes(1);
  });

  it('opens view logs dialog when View Logs button is pressed', async () => {
    const showLogsButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="View Logs"]' }));
    await showLogsButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledTimes(1);
  });
});
