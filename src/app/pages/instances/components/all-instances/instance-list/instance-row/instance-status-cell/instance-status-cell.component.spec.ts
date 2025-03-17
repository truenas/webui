import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { InstanceStatusCellComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-row/instance-status-cell/instance-status-cell.component';

describe('InstanceStatusCellComponent', () => {
  let spectator: SpectatorHost<InstanceStatusCellComponent>;

  const createHost = createHostFactory({
    component: InstanceStatusCellComponent,
    imports: [
      MapValuePipe,
    ],
  });

  function setupTest(instance: VirtualizationInstance): void {
    spectator = createHost(`
      <ix-instance-status-cell [instance]="instance"></ix-instance-status-cell>
    `, { hostProps: { instance } });
  }

  it('checks status for running instance', () => {
    setupTest({ status: VirtualizationStatus.Running } as VirtualizationInstance);

    expect(spectator.query('span')).toHaveText('Running');
  });

  it('checks status for stopped instance', () => {
    setupTest({ status: VirtualizationStatus.Stopped } as VirtualizationInstance);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for deploying instance', () => {
    setupTest({ status: VirtualizationStatus.Stopped } as VirtualizationInstance);

    expect(spectator.query('span')).toHaveText('Stopped');
  });

  it('checks status for stopping instance', () => {
    setupTest(
      { status: VirtualizationStatus.Unknown } as VirtualizationInstance,
    );

    expect(spectator.query('span')).toHaveText('Unknown');
  });
});
