import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { ContainerStatus } from 'app/enums/container.enum';
import { Container } from 'app/interfaces/container.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { ContainerStatusCellComponent } from 'app/pages/containers/components/all-containers/container-list/container-row/container-status-cell/container-status-cell.component';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainerStatusCellComponent', () => {
  let spectator: SpectatorHost<ContainerStatusCellComponent>;

  const createHost = createHostFactory({
    component: ContainerStatusCellComponent,
    imports: [
      MapValuePipe,
    ],
  });

  function setupTest(container: Container): void {
    spectator = createHost(`
      <ix-container-status-cell [container]="container"></ix-container-status-cell>
    `, { hostProps: { container } });
  }

  it('checks status for running container', () => {
    setupTest(fakeContainer({
      status: {
        state: ContainerStatus.Running,
        pid: 123,
        domain_state: null,
      },
    }));

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks status for stopped container', () => {
    setupTest(fakeContainer({
      status: {
        state: ContainerStatus.Stopped,
        pid: null,
        domain_state: null,
      },
    }));

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for deploying container', () => {
    setupTest(fakeContainer({
      status: {
        state: ContainerStatus.Stopped,
        pid: null,
        domain_state: null,
      },
    }));

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for stopping container', () => {
    setupTest(fakeContainer({
      status: {
        state: ContainerStatus.Unknown,
        pid: null,
        domain_state: null,
      },
    }));

    expect(spectator.query('span')).toHaveText('Unknown');
  });
});
