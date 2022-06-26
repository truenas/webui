import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManageUnusedDiskDialogComponent,
} from 'app/pages/storage2/components/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';
import { UnusedDiskCardComponent } from './unused-disk-card.component';

describe('UnusedDiskCardComponent', () => {
  let spectator: Spectator<UnusedDiskCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: UnusedDiskCardComponent,
    declarations: [
      ManageUnusedDiskDialogComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        pools: [
          { id: 1, name: 'DEV' },
          { id: 2, name: 'TEST' },
        ] as Pool[],
        unusedDisks: [
          { devname: 'sdb', identifier: '{serial_lunid}BBBBB1' },
          { devname: 'sdc', identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929' },
        ] as UnusedDisk[],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a title', () => {
    expect(spectator.query('.mat-card-title')).toHaveText('Unassigned Disks');
  });

  it('shows a value', () => {
    expect(spectator.query('.value')).toHaveText('2');
  });

  it('opens ManageUnusedDiskDialogComponent when clicks Add To Pool button', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open');

    const addToPoolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add To Pool' }));
    await addToPoolButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ManageUnusedDiskDialogComponent, {
      data: {
        pools: [
          { id: 1, name: 'DEV' },
          { id: 2, name: 'TEST' },
        ] as Pool[],
        unusedDisks: [
          { devname: 'sdb', identifier: '{serial_lunid}BBBBB1' },
          { devname: 'sdc', identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929' },
        ] as UnusedDisk[],
      },
    });
  });
});
