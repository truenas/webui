import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { UnlockSedDialog } from './unlock-sed-dialog.component';

describe('UnlockSedDialog', () => {
  let spectator: Spectator<UnlockSedDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: UnlockSedDialog,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('disk.unlock_sed'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
      mockProvider(LoaderService, {
        withLoader: () => <T>(source$: T) => source$,
      }),
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

  it('shows dialog title with disk name', () => {
    const title = spectator.query('h1');
    expect(title).toHaveText('Unlock SED for sda');
  });

  it('shows informational message', () => {
    const message = spectator.query('p');
    expect(message).toHaveText('Successfully unlocking the disk will automatically update the database.');
  });

  it('calls disk.unlock_sed with correct payload when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Password: 'test-password',
    });

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock' }));
    await unlockButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.unlock_sed', [{
      name: 'sda',
      password: 'test-password',
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('disables submit button when password is empty', async () => {
    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock' }));
    expect(await unlockButton.isDisabled()).toBe(true);
  });
});
