import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { DialogService } from 'app/services';
import { LockDatasetDialogComponent } from './lock-dataset-dialog.component';

describe('LockDatasetDialogComponent', () => {
  let spectator: Spectator<LockDatasetDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: LockDatasetDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
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

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(EntityJobComponent, expect.anything());
    expect(mockEntityJobComponentRef.componentInstance.setCall)
      .toHaveBeenCalledWith('pool.dataset.lock', ['pool/dataset', { force_umount: true }]);
    expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
