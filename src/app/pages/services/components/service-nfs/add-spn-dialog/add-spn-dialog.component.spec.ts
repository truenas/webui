import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddSpnDialog } from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';

describe('AddSpnDialogComponent', () => {
  let spectator: Spectator<AddSpnDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AddSpnDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('nfs.add_principal'),
      ]),
      mockProvider(DialogRef),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('submit credentials', async () => {
    const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
    await nameInput.setValue('username');

    const passwordInput = await loader.getHarness(TnInputHarness.with({ name: 'password' }));
    await passwordInput.setValue('password');

    const save = await loader.getHarness(TnButtonHarness.with({ label: 'Submit' }));
    await save.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nfs.add_principal', [{
      username: 'username',
      password: 'password',
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Credentials have been successfully added.');
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });
});
