import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DeleteUserDialog } from 'app/pages/credentials/users/all-users/user-details/delete-user-dialog/delete-user-dialog.component';

describe('DeleteUserDialogComponent', () => {
  let spectator: Spectator<DeleteUserDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteUserDialog,
    imports: [
      ReactiveFormsModule,
    ],
    detectChanges: false,
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
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
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
    spectator.detectChanges();

    expect(spectator.query('.message')).toHaveText(
      'Are you sure you want to delete user "peppa"?',
    );

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.delete', [2, { delete_group: false }]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('User deleted');
  });

  it('shows Delete primary group checkbox if this is the last user in the group', async () => {
    const websocketMock = spectator.inject(MockApiService);
    websocketMock.mockCall('group.query', [
      {
        users: [1],
      },
    ] as Group[]);
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('group.query', [[['id', '=', 23]]]);

    const deleteGroupCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Delete user primary group `swine`' }));
    await deleteGroupCheckbox.check();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.delete', [2, { delete_group: true }]);
  });
});
