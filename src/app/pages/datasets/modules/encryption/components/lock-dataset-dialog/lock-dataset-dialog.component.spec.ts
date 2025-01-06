import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { LockDatasetDialogComponent } from './lock-dataset-dialog.component';

describe('LockDatasetDialogComponent', () => {
  let spectator: Spectator<LockDatasetDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: LockDatasetDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialogRef),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockApi([
        mockJob('pool.dataset.lock', fakeSuccessfulJob()),
      ]),
      {
        provide: MAT_DIALOG_DATA,
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
    const forceCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Force unmount' }));
    await forceCheckbox.setValue(true);

    const lockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Lock' }));
    await lockButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job)
      .toHaveBeenCalledWith('pool.dataset.lock', ['pool/dataset', { force_umount: true }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
