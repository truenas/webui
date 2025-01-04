import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { OnOff } from 'app/enums/on-off.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AutotrimDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/autotrim-dialog/autotrim-dialog.component';

describe('AutotrimDialogComponent', () => {
  let spectator: Spectator<AutotrimDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AutotrimDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 47,
          autotrim: {
            value: 'on',
          },
        } as Pool,
      },
      mockApi([
        mockJob('pool.update', fakeSuccessfulJob()),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current Auto TRIM setting', async () => {
    const autotrim = await loader.getHarness(IxCheckboxHarness);
    expect(await autotrim.getValue()).toBe(true);
  });

  it('saves updated Auto TRIM setting when form is submitted', async () => {
    const autotrim = await loader.getHarness(IxCheckboxHarness);
    await autotrim.setValue(false);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.update', [47, { autotrim: OnOff.Off }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
