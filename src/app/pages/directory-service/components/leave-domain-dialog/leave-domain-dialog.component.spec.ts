import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
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
      mockProvider(MatDialogRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('leaves Active Directory domain when form is filled in and submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Username: 'Administrator',
      Password: '12345678',
    });

    const leaveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Leave Domain' }));
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
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
