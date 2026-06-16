import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DeleteExtentDialog,
} from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';

describe('DeleteExtentDialogComponent', () => {
  let spectator: Spectator<DeleteExtentDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteExtentDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('iscsi.extent.delete'),
      ]),
      mockProvider(DialogRef),
      mockProvider(DialogService),
      {
        provide: DIALOG_DATA,
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

    const forceCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Force' }));
    await forceCheckbox.check();

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await submitButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.extent.delete', [1, false, true]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows a Delete File checkbox when extent is a file', async () => {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: {
            id: 1,
            name: 'test',
            type: IscsiExtentType.File,
          } as IscsiExtent,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const removeCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Remove file?' }));
    await removeCheckbox.check();
    const forceCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Force' }));
    await forceCheckbox.check();

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await submitButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.extent.delete', [1, true, true]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });
});
