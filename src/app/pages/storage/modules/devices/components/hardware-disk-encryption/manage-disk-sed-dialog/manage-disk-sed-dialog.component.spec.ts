import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Disk } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';
import { ManageDiskSedDialogComponent } from './manage-disk-sed-dialog.component';

describe('ManageDiskSedDialogComponent', () => {
  let spectator: Spectator<ManageDiskSedDialogComponent>;
  let loader: HarnessLoader;
  let passwordInput: IxInputHarness;
  const createComponent = createComponentFactory({
    component: ManageDiskSedDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('disk.query', [
          {
            identifier: 'disk1234',
            passwd: '123456',
          },
        ] as Disk[]),
        mockCall('disk.update'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      {
        provide: MAT_DIALOG_DATA,
        useValue: 'sda',
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    passwordInput = await loader.getHarness(IxInputHarness);
  });

  it('loads and shows if password is currently set for the current disk', async () => {
    expect(spectator.inject(WebSocketService).call)
      .toHaveBeenCalledWith('disk.query', [[['devname', '=', 'sda']], { extra: { passwords: true } }]);

    expect(await passwordInput.getValue()).toBe('123456');
  });

  it('allows password to be cleared if it is set', async () => {
    const clearButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clear SED Password' }));
    await clearButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('disk.update', ['disk1234', { passwd: '' }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('SED password updated.');
  });

  it('allows new SED password to be set', async () => {
    await passwordInput.setValue('new-password');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('disk.update', ['disk1234', { passwd: 'new-password' }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('SED password updated.');
  });
});
