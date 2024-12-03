import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  byTextContent, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import {
  InspectVdevsDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import {
  ManualSelectionVdevComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-vdev/manual-selection-vdev.component';
import { PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('InspectVdevsDialogComponent', () => {
  let spectator: Spectator<InspectVdevsDialogComponent>;
  const topology = {
    [VdevType.Data]: {
      layout: CreateVdevLayout.Stripe,
      vdevs: [
        [{ devname: 'ada0' }, { devname: 'ada1' }, { devname: 'ada2' }],
      ],
    },
    [VdevType.Log]: {
      layout: CreateVdevLayout.Mirror,
      vdevs: [
        [{ devname: 'ada3' }, { devname: 'ada4' }],
        [{ devname: 'ada5' }, { devname: 'ada6' }],
      ],
    },
  } as PoolManagerTopology;
  const createComponent = createComponentFactory({
    component: InspectVdevsDialogComponent,
    declarations: [
      MockComponent(ManualSelectionVdevComponent),
    ],
    providers: [
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          topology,
          enclosures: [
            { id: 'id1', name: 'ENC 1' },
            { id: 'id2', name: 'ENC 2' },
          ],
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows categories of present vdev types on the left', () => {
    const vdevTypes = spectator.queryAll('.vdev-type');
    expect(vdevTypes).toHaveLength(2);
    expect(vdevTypes[0]).toHaveText('Data');
    expect(vdevTypes[1]).toHaveText('Log');
  });

  it('shows vdevs of the currently selected vdev type', () => {
    expect(spectator.query('.vdevs-header')).toHaveText('Data VDEVs');
    const vdevs = spectator.queryAll(ManualSelectionVdevComponent);
    expect(vdevs).toHaveLength(1);
    expect(vdevs[0].vdev).toMatchObject({
      disks: [
        { devname: 'ada0' },
        { devname: 'ada1' },
        { devname: 'ada2' },
      ],
    });
    expect(vdevs[0].layout).toEqual(CreateVdevLayout.Stripe);
  });

  it('switches to a different vdev type when user presses on the type in sidebar', () => {
    spectator.click(byTextContent('Log', { selector: '.vdev-type' }));

    expect(spectator.query('.vdevs-header')).toHaveText('Log VDEVs');
    const vdevs = spectator.queryAll(ManualSelectionVdevComponent);
    expect(vdevs).toHaveLength(2);
    expect(vdevs[0].vdev).toMatchObject({
      disks: [
        { devname: 'ada3' },
        { devname: 'ada4' },
      ],
    });
    expect(vdevs[0].layout).toEqual(CreateVdevLayout.Mirror);
    expect(vdevs[1].vdev).toMatchObject({
      disks: [
        { devname: 'ada5' },
        { devname: 'ada6' },
      ],
    });
  });

  it('closes the dialog when X icon is pressed', () => {
    spectator.click('.close-icon');

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
