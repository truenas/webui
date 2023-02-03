import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockJob, mockWebsocket2 } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskWipeMethod } from 'app/enums/disk-wipe-method.enum';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  DiskWipeDialogComponent,
} from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import { DialogService } from 'app/services';
import { WebSocketService2 } from 'app/services/ws2.service';

describe('DiskWipeDialogComponent', () => {
  let spectator: Spectator<DiskWipeDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DiskWipeDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      EntityModule,
    ],
    providers: [
      mockWebsocket2([
        mockJob('disk.wipe'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: { diskName: 'sda' },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('wipes disk with selected method when dialog is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Method: 'Full with zeros',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Wipe' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService2).job).toHaveBeenCalledWith('disk.wipe', ['sda', DiskWipeMethod.Full]);
  });
});
