import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { LeaveDomainDialogComponent } from './leave-domain-dialog.component';

describe('LeaveDomainDialogComponent', () => {
  let spectator: Spectator<LeaveDomainDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: LeaveDomainDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('activedirectory.leave', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService),
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

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('activedirectory.leave', [{
      username: 'Administrator',
      password: '12345678',
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
