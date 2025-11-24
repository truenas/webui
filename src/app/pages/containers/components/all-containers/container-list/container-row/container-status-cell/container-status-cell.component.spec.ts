import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { ContainerStatus } from 'app/enums/container.enum';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { ContainerStatusCellComponent } from 'app/pages/containers/components/all-containers/container-list/container-row/container-status-cell/container-status-cell.component';
import { fakeContainerInstance } from 'app/pages/containers/utils/fake-container-instance.utils';

describe('ContainerStatusCellComponent', () => {
  let spectator: SpectatorHost<ContainerStatusCellComponent>;

  const createHost = createHostFactory({
    component: ContainerStatusCellComponent,
    imports: [
      MapValuePipe,
    ],
  });

  function setupTest(instance: ContainerInstance): void {
    spectator = createHost(`
      <ix-container-status-cell [instance]="instance"></ix-container-status-cell>
    `, { hostProps: { instance } });
  }

  it('checks status for running instance', () => {
    setupTest(fakeContainerInstance({
      status: {
        state: ContainerStatus.Running,
        pid: 123,
        domain_state: null,
      },
    }));

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks status for stopped instance', () => {
    setupTest(fakeContainerInstance({
      status: {
        state: ContainerStatus.Stopped,
        pid: null,
        domain_state: null,
      },
    }));

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for deploying instance', () => {
    setupTest(fakeContainerInstance({
      status: {
        state: ContainerStatus.Stopped,
        pid: null,
        domain_state: null,
      },
    }));

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for stopping instance', () => {
    setupTest(fakeContainerInstance({
      status: {
        state: ContainerStatus.Unknown,
        pid: null,
        domain_state: null,
      },
    }));

    expect(spectator.query('span')).toHaveText('Unknown');
  });
});
