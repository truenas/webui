import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskWipeMethod } from 'app/enums/disk-wipe-method.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DiskWipeDialog,
} from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';

describe('DiskWipeDialogComponent', () => {
  let spectator: Spectator<DiskWipeDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DiskWipeDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('disk.wipe'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => of(true)),
      }),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
        useValue: { diskName: 'sda' },
      },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('wipes disk with selected method when dialog is submitted', async () => {
    const methodSelect = await loader.getHarness(TnSelectHarness);
    await methodSelect.selectOption(/Full with zeros/);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Wipe' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('disk.wipe', ['sda', DiskWipeMethod.Full]);
  });
});
