import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  AutotrimDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/autotrim-dialog/autotrim-dialog.component';

describe('AutotrimDialogComponent', () => {
  let spectator: Spectator<AutotrimDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AutotrimDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      {
        provide: DIALOG_DATA,
        useValue: {
          id: 47,
          autotrim: {
            value: 'on',
          },
        } as Pool,
      },
      mockTypedApi([
        mockTypedJob('pool.update', { state: JobState.Success }),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockProvider(DialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current Auto TRIM setting', async () => {
    const autotrim = await loader.getHarness(TnCheckboxHarness);
    expect(await autotrim.isChecked()).toBe(true);
  });

  it('saves updated Auto TRIM setting when form is submitted', async () => {
    const autotrim = await loader.getHarness(TnCheckboxHarness);
    await autotrim.uncheck();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('pool.update', [47, { autotrim: OnOff.Off }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });
});
