import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DeleteExtentDialogComponent,
} from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';

describe('DeleteExtentDialogComponent', () => {
  let spectator: Spectator<DeleteExtentDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteExtentDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.extent.delete', [1, false, true]);
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.extent.delete', [1, true, true]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
