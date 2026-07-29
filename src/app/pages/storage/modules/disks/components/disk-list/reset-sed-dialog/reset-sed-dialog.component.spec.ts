import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnDialogHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ResetSedDialog } from './reset-sed-dialog.component';

describe('ResetSedDialog', () => {
  let spectator: Spectator<ResetSedDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ResetSedDialog,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('disk.reset_sed'),
      ]),
      mockProvider(DialogRef),
      mockProvider(SnackbarService),
      mockProvider(LoaderService, {
        withLoader: () => <T>(source$: T) => source$,
      }),
      {
        provide: DIALOG_DATA,
        useValue: { diskName: 'sdf' },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows dialog title', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('SED Reset - Secure Erase');
  });

  it('shows critical warning message', () => {
    const warningHeader = spectator.query('.warning-header');
    expect(warningHeader).toHaveText('CRITICAL WARNING');

    const warningMain = spectator.query('.warning-main');
    expect(warningMain).toHaveText('This operation is IRREVERSIBLE and will PERMANENTLY DESTROY ALL DATA on this disk.');
  });

  it('shows disk name', () => {
    const diskName = spectator.query('.disk-name');
    expect(diskName).toHaveText('Disk: sdf');
  });

  it('shows PSID help information', () => {
    const psidTitle = spectator.query('.psid-info-title');
    expect(psidTitle).toHaveText('Where to find the PSID:');

    const exampleLabel = spectator.query('.example-label');
    expect(exampleLabel).toHaveText('Example PSID format:');

    const exampleCode = spectator.query('code');
    expect(exampleCode).toHaveText('ABCD1234EFGH5678IJKL9012');
  });

  it('calls disk.reset_sed with correct payload when form is submitted', async () => {
    const psidInput = await loader.getHarness(TnInputHarness);
    await psidInput.setValue('TESTPSID12345678');

    const understand = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'I understand this will permanently destroy all data on this disk' }),
    );
    await understand.check();

    const resetButton = await loader.getHarness(TnButtonHarness.with({ label: 'Perform SED Reset' }));
    await resetButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.reset_sed', [{
      name: 'sdf',
      psid: 'TESTPSID12345678',
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('disables submit button when PSID is empty', async () => {
    const resetButton = await loader.getHarness(TnButtonHarness.with({ label: 'Perform SED Reset' }));
    expect(await resetButton.isDisabled()).toBe(true);
  });

  it('disables submit button when confirmation checkbox is not checked', async () => {
    const psidInput = await loader.getHarness(TnInputHarness);
    await psidInput.setValue('TESTPSID12345678');

    const resetButton = await loader.getHarness(TnButtonHarness.with({ label: 'Perform SED Reset' }));
    expect(await resetButton.isDisabled()).toBe(true);
  });
});
