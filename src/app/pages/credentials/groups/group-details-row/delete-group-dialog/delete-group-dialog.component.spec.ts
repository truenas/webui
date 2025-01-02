import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Group } from 'app/interfaces/group.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DeleteGroupDialogComponent,
} from 'app/pages/credentials/groups/group-details-row/delete-group-dialog/delete-group-dialog.component';

describe('DeleteGroupDialogComponent', () => {
  let spectator: Spectator<DeleteGroupDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteGroupDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('group.delete'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 2,
          group: 'vip',
          users: [4, 5, 6],
        } as Group,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes group when dialog is submitted', async () => {
    expect(spectator.query('.message')).toHaveText(
      'Are you sure you want to delete group "vip"?',
    );

    const deleteUsersCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Delete 3 users with this primary group?' }));
    await deleteUsersCheckbox.setValue(true);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('group.delete', [2, { delete_users: true }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Group deleted');
  });
});
