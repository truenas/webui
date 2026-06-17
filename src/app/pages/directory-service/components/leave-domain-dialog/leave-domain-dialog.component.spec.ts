import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { LeaveDomainDialog } from './leave-domain-dialog.component';

describe('LeaveDomainDialogComponent', () => {
  let spectator: Spectator<LeaveDomainDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: LeaveDomainDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('directoryservices.leave'),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockProvider(SnackbarService),
      mockProvider(DialogRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('leaves Active Directory domain when form is filled in and submitted', async () => {
    const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
    await usernameInput.setValue('Administrator');

    const passwordInput = await loader.getHarness(TnInputHarness.with({ name: 'password' }));
    await passwordInput.setValue('12345678');

    const leaveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Leave Domain' }));
    await leaveButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('directoryservices.leave', [{
      credential: {
        credential_type: DirectoryServiceCredentialType.KerberosUser,
        username: 'Administrator',
        password: '12345678',
      },
    }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });
});
