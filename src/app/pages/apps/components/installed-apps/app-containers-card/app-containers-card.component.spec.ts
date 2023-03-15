import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppContainersCardComponent } from './app-containers-card.component';

describe('AppContainersCardComponent', () => {
  let spectator: Spectator<AppContainersCardComponent>;

  const app = {
    id: 'ix-test-app',
    update_available: true,
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
      },
      deployments: [{}, {}],
      pods: [{}],
      statefulsets: [{}],
    },
  } as unknown as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppContainersCardComponent,
    declarations: [
      MockComponent(NgxSkeletonLoaderComponent),
    ],
    providers: [
      mockProvider(ApplicationsService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Containers');
    expect(spectator.query('mat-card-header button')).toHaveText('Shell');
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
});
