import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddSpnDialogComponent } from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';

describe('AddSpnDialogComponent', () => {
  let spectator: Spectator<AddSpnDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AddSpnDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('nfs.add_principal'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('submit credentials', async () => {
    const form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      Name: 'username',
      Password: 'password',
    });

    const save = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
    await save.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nfs.add_principal', [{
      username: 'username',
      password: 'password',
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Credentials have been successfully added.');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
