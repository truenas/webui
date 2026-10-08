import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness, TnRadioGroupHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  PruneDedupTableDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/prune-dedup-table-dialog/prune-dedup-table-dialog.component';

describe('PruneDedupTableDialogComponent', () => {
  let spectator: Spectator<PruneDedupTableDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: PruneDedupTableDialog,
    providers: [
      mockTypedApi([
        mockTypedJob('pool.ddt_prune', { state: JobState.Success }),
      ]),
      mockProvider(DialogRef),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      {
        provide: DIALOG_DATA,
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
    const pruneByRadio = await loader.getHarness(TnRadioGroupHarness.with({ testId: 'radio-group-prune-by' }));
    await pruneByRadio.select('Percentage');

    const sliderThumb = spectator.query('input[tnSliderThumb]') as HTMLInputElement;
    sliderThumb.value = '50';
    sliderThumb.dispatchEvent(new Event('input'));
    spectator.detectChanges();

    const pruneButton = await loader.getHarness(TnButtonHarness.with({ label: 'Prune' }));
    await pruneButton.click();

    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('pool.ddt_prune', [{ pool_name: 'pewl', percentage: 50 }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('prunes the table with age setting', async () => {
    const pruneByRadio = await loader.getHarness(TnRadioGroupHarness.with({ testId: 'radio-group-prune-by' }));
    await pruneByRadio.select('Age');

    const daysInput = await loader.getHarness(TnInputHarness);
    await daysInput.setValue('10');

    const pruneButton = await loader.getHarness(TnButtonHarness.with({ label: 'Prune' }));
    await pruneButton.click();

    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('pool.ddt_prune', [{ pool_name: 'pewl', days: 10 }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });
});
