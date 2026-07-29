import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialogHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
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
      mockProvider(DialogRef),
      mockProvider(SnackbarService),
      mockProvider(LoaderService, {
        withLoader: () => <T>(source$: T) => source$,
      }),
      {
        provide: DIALOG_DATA,
        useValue: { diskName: 'sda' },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows dialog title with disk name', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('Unlock SED for sda');
  });

  it('shows informational message', () => {
    const message = spectator.query('p');
    expect(message).toHaveText('Successfully unlocking the disk will automatically update the database.');
  });

  it('calls disk.unlock_sed with correct payload when form is submitted', async () => {
    const passwordInput = await loader.getHarness(TnInputHarness);
    await passwordInput.setValue('test-password');

    const unlockButton = await loader.getHarness(TnButtonHarness.with({ label: 'Unlock' }));
    await unlockButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.unlock_sed', [{
      name: 'sda',
      password: 'test-password',
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('disables submit button when password is empty', async () => {
    const unlockButton = await loader.getHarness(TnButtonHarness.with({ label: 'Unlock' }));
    expect(await unlockButton.isDisabled()).toBe(true);
  });
});
