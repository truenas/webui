import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DeleteUserDialogComponent,
} from 'app/pages/account/users/user-details-row/delete-user-dialog/delete-user-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DeleteUserDialogComponent', () => {
  let spectator: Spectator<DeleteUserDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteUserDialogComponent,
    imports: [
      AppLoaderModule,
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
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

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('user.delete', [2, { delete_group: false }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('User deleted');
  });

  it('shows Delete primary group checkbox if this is the last user in the group', async () => {
    const websocketMock = spectator.inject(MockWebsocketService);
    websocketMock.mockCall('group.query', [
      {
        users: [1],
      },
    ] as Group[]);
    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('group.query', [[['id', '=', 23]]]);

    const deleteGroupCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Delete user primary group `swine`' }));
    await deleteGroupCheckbox.setValue(true);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('user.delete', [2, { delete_group: true }]);
  });
});
