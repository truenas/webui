import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DeleteUserDialogComponent,
} from 'app/pages/credentials/users/user-details-row/delete-user-dialog/delete-user-dialog.component';

describe('DeleteUserDialogComponent', () => {
  let spectator: Spectator<DeleteUserDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteUserDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('user.delete'),
        mockCall('group.query', [
          {
            users: [1, 2, 3],
          },
        ] as Group[]),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 2,
          username: 'peppa',
          group: {
            id: 23,
            bsdgrp_group: 'swine',
          },
        } as User,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes user when dialog is submitted', async () => {
    expect(spectator.query('.message')).toHaveText(
      'Are you sure you want to delete user "peppa"?',
    );

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.delete', [2, { delete_group: false }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('User deleted');
  });

  it('shows Delete primary group checkbox if this is the last user in the group', async () => {
    const websocketMock = spectator.inject(MockApiService);
    websocketMock.mockCall('group.query', [
      {
        users: [1],
      },
    ] as Group[]);
    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('group.query', [[['id', '=', 23]]]);

    const deleteGroupCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Delete user primary group `swine`' }));
    await deleteGroupCheckbox.setValue(true);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.delete', [2, { delete_group: true }]);
  });
});
