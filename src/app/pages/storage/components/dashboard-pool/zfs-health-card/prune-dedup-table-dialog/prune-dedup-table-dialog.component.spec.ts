import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSliderHarness } from '@angular/material/slider/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  PruneDedupTableDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/prune-dedup-table-dialog/prune-dedup-table-dialog.component';
import { ApiService } from 'app/services/websocket/api.service';

describe('PruneDedupTableDialogComponent', () => {
  let spectator: Spectator<PruneDedupTableDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: PruneDedupTableDialogComponent,
    providers: [
      mockApi([
        mockJob('pool.ddt_prune', fakeSuccessfulJob()),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          name: 'pewl',
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('prunes the table with percentage settings', async () => {
    const pruneByRadio = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Prune By' }));
    await pruneByRadio.setValue('Percentage');

    const percentageSlider = await loader.getHarness(MatSliderHarness);
    const sliderThumb = await percentageSlider.getEndThumb();
    await sliderThumb.setValue(50);

    const pruneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Prune' }));
    await pruneButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.ddt_prune', [{ pool_name: 'pewl', percentage: 50 }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('prunes the table with age setting', async () => {
    const pruneByRadio = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Prune By' }));
    await pruneByRadio.setValue('Age');

    const daysInput = await loader.getHarness(IxInputHarness.with({ label: 'Age (in days)' }));
    await daysInput.setValue('10');

    const pruneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Prune' }));
    await pruneButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.ddt_prune', [{ pool_name: 'pewl', days: 10 }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });
});
