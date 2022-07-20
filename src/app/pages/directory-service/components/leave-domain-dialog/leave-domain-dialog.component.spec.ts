import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services';
import { LeaveDomainDialogComponent } from './leave-domain-dialog.component';

describe('LeaveDomainDialogComponent', () => {
  let spectator: Spectator<LeaveDomainDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: LeaveDomainDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockJob('activedirectory.leave', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('it leaves Active Directory domain when form is filled in and submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Username: 'Administrator',
      Password: '12345678',
    });

    const leaveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Leave Domain' }));
    await leaveButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('activedirectory.leave', [{
      username: 'Administrator',
      password: '12345678',
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
