import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { LockDatasetDialog } from './lock-dataset-dialog.component';

describe('LockDatasetDialogComponent', () => {
  let spectator: Spectator<LockDatasetDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: LockDatasetDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogRef),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockTypedApi([
        mockTypedJob('pool.dataset.lock', { state: JobState.Success }),
      ]),
      {
        provide: DIALOG_DATA,
        useValue: {
          id: 'pool/dataset',
          name: 'dataset',
        } as Dataset,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('locks a dataset when form is submitted', async () => {
    const forceCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Force unmount' }));
    await forceCheckbox.check();

    const lockButton = await loader.getHarness(TnButtonHarness.with({ label: 'Lock' }));
    await lockButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(TypedApiService).job)
      .toHaveBeenCalledWith('pool.dataset.lock', ['pool/dataset', { force_umount: true }]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });
});
