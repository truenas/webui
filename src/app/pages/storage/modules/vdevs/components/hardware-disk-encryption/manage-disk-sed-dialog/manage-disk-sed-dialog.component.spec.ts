import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ManageDiskSedDialog } from './manage-disk-sed-dialog.component';

describe('ManageDiskSedDialogComponent', () => {
  let spectator: Spectator<ManageDiskSedDialog>;
  let loader: HarnessLoader;
  let passwordInput: TnInputHarness;
  const createComponent = createComponentFactory({
    component: ManageDiskSedDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockTypedApi([
        mockTypedQuery('disk.query', [
          {
            identifier: 'disk1234',
            passwd: '123456',
          },
        ] as WebUiQueryEntity<'disk.query'>[]),
        mockTypedCall('disk.update', null),
      ]),
      mockProvider(DialogRef),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      {
        provide: DIALOG_DATA,
        useValue: 'sda',
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    passwordInput = await loader.getHarness(TnInputHarness);
  });

  it('loads and shows if password is currently set for the current disk', async () => {
    expect(spectator.inject(TypedApiService).query)
      .toHaveBeenCalledWith('disk.query', [['devname', '=', 'sda']], { extra: { passwords: true } });

    expect(await passwordInput.getValue()).toBe('123456');
  });

  it('allows password to be cleared if it is set', async () => {
    const clearButton = await loader.getHarness(TnButtonHarness.with({ label: 'Clear SED Password' }));
    await clearButton.click();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('disk.update', ['disk1234', { passwd: '' }]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('SED password updated.');
  });

  it('allows new SED password to be set', async () => {
    await passwordInput.setValue('new-password');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('disk.update', ['disk1234', { passwd: 'new-password' }]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('SED password updated.');
  });
});
