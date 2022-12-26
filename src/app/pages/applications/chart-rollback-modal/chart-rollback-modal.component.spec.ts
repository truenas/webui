import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { ChartRelease, ChartReleaseVersion } from 'app/interfaces/chart-release.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  ChartRollbackModalComponent,
} from 'app/pages/applications/chart-rollback-modal/chart-rollback-modal.component';

describe('ChartRollbackModalComponent', () => {
  let spectator: Spectator<ChartRollbackModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ChartRollbackModalComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          name: 'my-app',
          history: {
            '0.9.9': {} as ChartReleaseVersion,
            '0.9.8': {} as ChartReleaseVersion,
          } as ChartRelease['history'],
        } as ChartRelease,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of previous versions from chart release to roll back to', async () => {
    const versionSelect = await loader.getHarness(IxSelectHarness);
    const options = await versionSelect.getOptionLabels();

    expect(options).toEqual(['0.9.9', '0.9.8']);
  });

  it('rolls back chart when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Version: '0.9.8',
      'Roll back snapshots': true,
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Roll Back' }));
    await rollbackButton.click();

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
      'chart.release.rollback',
      ['my-app', { item_version: '0.9.8', rollback_snapshot: true }],
    );
    expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
