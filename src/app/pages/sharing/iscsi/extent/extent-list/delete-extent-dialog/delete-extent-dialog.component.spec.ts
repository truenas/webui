import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  DeleteExtentDialogComponent,
} from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DeleteExtentDialogComponent', () => {
  let spectator: Spectator<DeleteExtentDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteExtentDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('iscsi.extent.delete'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 1,
          name: 'test',
          type: IscsiExtentType.Disk,
        } as IscsiExtent,
      },
    ],
  });

  it('deletes an iSCSI extent when dialog is submitted', async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Force: true,
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await submitButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('iscsi.extent.delete', [1, false, true]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows a Delete File checkbox when extent is a file', async () => {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            id: 1,
            name: 'test',
            type: IscsiExtentType.File,
          } as IscsiExtent,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Remove file?': true,
      Force: true,
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await submitButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('iscsi.extent.delete', [1, true, true]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
