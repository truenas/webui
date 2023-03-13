import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ChartRelease, ChartContainerImage } from 'app/interfaces/chart-release.interface';
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
        } as ChartContainerImage,
      },
      deployments: [{} as unknown],
      pods: [{} as unknown],
      statefulsets: [{} as unknown],
    },
  } as unknown as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppContainersCardComponent,
    declarations: [],
    providers: [],
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
    // TODO: Merge app and appResources and fix test case
    const details = spectator.queryAll('.details-item');
    expect(details).toHaveLength(4);

    expect(details[0].querySelector('.label')).toHaveText('Pods:');
    expect(details[0].querySelector('.value')).toHaveText('0');

    expect(details[1].querySelector('.label')).toHaveText('Used Ports:');
    expect(details[1].querySelector('.value')).toHaveText('');

    expect(details[2].querySelector('.label')).toHaveText('Deployments:');
    expect(details[2].querySelector('.value')).toHaveText('0');

    expect(details[3].querySelector('.label')).toHaveText('Stateful Sets:');
    expect(details[3].querySelector('.value')).toHaveText('0');
  });
});
