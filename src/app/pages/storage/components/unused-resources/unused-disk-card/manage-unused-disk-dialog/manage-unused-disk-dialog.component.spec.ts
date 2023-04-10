import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ManageUnusedDiskDialogComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';
import {
  ManageUnusedDiskDialogResource,
} from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.interface';

describe('ManageUnusedDiskDialogComponent', () => {
  let spectator: Spectator<ManageUnusedDiskDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: ManageUnusedDiskDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          pools: [
            { id: 1, name: 'DEV' },
            { id: 2, name: 'TEST' },
          ] as Pool[],
          unusedDisks: [
            { devname: 'sdb', size: 102400000, identifier: '{serial_lunid}BBBBB1' },
            { devname: 'sdc', size: 204800000, identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929' },
          ] as UnusedDisk[],
        } as ManageUnusedDiskDialogResource,
      },
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    jest.spyOn(spectator.inject(Router), 'navigate').mockImplementation();
  });

  it('shows a title', () => {
    expect(spectator.query('.mat-mdc-dialog-title')).toHaveText('Add To Pool');
  });

  it('shows the list of unused disks', () => {
    const unusedDiskItems = spectator.queryAll('.unused-disks li');
    expect(unusedDiskItems).toHaveLength(2);
  });

  it('redirects to create pool page when choosing Add Disks To New Pool', async () => {
    await form.fillForm({
      'Add Disks To:': 'New Pool',
    });

    const addDisksButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Disks' }));
    await addDisksButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/storage', 'create']);
  });

  it('redirects to add disks to pool page when choosing Add Disks To Existing Pool', async () => {
    await form.fillForm({
      'Add Disks To:': 'Existing Pool',
    });

    await form.fillForm({
      'Existing Pool': 'TEST',
    });

    const addDisksButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Disks' }));
    await addDisksButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/storage', 2, 'add-vdevs']);
  });
});
