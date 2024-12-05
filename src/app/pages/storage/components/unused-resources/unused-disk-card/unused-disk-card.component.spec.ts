import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  ManageUnusedDiskDialogComponent,
} from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';
import { UnusedDiskCardComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/unused-disk-card.component';

describe('UnusedDiskCardComponent', () => {
  let spectator: Spectator<UnusedDiskCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: UnusedDiskCardComponent,
    imports: [
      ReactiveFormsModule,
      ManageUnusedDiskDialogComponent,
    ],
    providers: [mockAuth()],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        disks: [
          { devname: 'sdb', identifier: '{serial_lunid}BBBBB1', size: 123456789 },
          { devname: 'sdc', identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929', size: 123456789 },
        ] as DetailsDisk[],
        title: 'Unused Disks',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a title', () => {
    expect(spectator.query('.mat-mdc-card-title')).toHaveText('Unused Disks');
  });

  it('shows a value', () => {
    expect(spectator.query('.value')).toHaveText('2');
  });

  it('opens ManageUnusedDiskDialogComponent when clicks Add To Pool button', async () => {
    jest.spyOn(spectator.component.addToStorage, 'emit');

    const addToPoolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add To Pool' }));
    await addToPoolButton.click();

    expect(spectator.component.addToStorage.emit).toHaveBeenCalled();
  });
});
