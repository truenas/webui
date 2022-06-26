import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { ManageUnusedDiskDialogResource } from 'app/pages/storage2/components/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.interface';
import { ManageUnusedDiskDialogComponent } from './manage-unused-disk-dialog.component';

describe('ManageUnusedDiskDialogComponent', () => {
  let spectator: Spectator<ManageUnusedDiskDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ManageUnusedDiskDialogComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          pools: [
            { id: 1, name: 'DEV' },
            { id: 2, name: 'TEST' },
          ] as Pool[],
          unusedDisks: [
            { devname: 'sdb', identifier: '{serial_lunid}BBBBB1' },
            { devname: 'sdc', identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929' },
          ] as UnusedDisk[],
        } as ManageUnusedDiskDialogResource,
      },
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a title', () => {
    expect(spectator.query('.mat-dialog-title')).toHaveText('Add To Pool');
  });

  it('shows the list of unused disks and pools', () => {
    const unusedDiskItems = spectator.queryAll('.list.unassigned-disks .list-item');
    expect(unusedDiskItems).toHaveLength(2);

    const poolItems = spectator.queryAll('.list.pools .list-item');
    expect(poolItems).toHaveLength(2);
  });

  it('redirects to add disks to pool page when clicks Add Disks button', async () => {
    jest.spyOn(spectator.inject(Router), 'navigate').mockImplementation();

    const [, secondPoolButton] = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Add Disks' }));
    await secondPoolButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'storage', 'manager', 2]);
  });

  it('redirects to create pool page when clicks Create Pool button', async () => {
    jest.spyOn(spectator.inject(Router), 'navigate').mockImplementation();

    const createPoolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Pool' }));
    await createPoolButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'storage', 'manager']);
  });
});
