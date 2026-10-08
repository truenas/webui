import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { NewDeduplicationQuotaSetting } from 'app/enums/deduplication-setting.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  SetDedupQuotaComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/set-dedup-quota/set-dedup-quota.component';

describe('SetDedupQuotaComponent', () => {
  let spectator: Spectator<SetDedupQuotaComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SetDedupQuotaComponent,
    providers: [
      mockTypedApi([
        mockTypedJob('pool.update', { state: JobState.Success }),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockProvider(DialogRef),
    ],
  });

  function setupTest(pool: Partial<Pool>): void {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: {
            id: 2,
            ...pool,
          },
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('auto', () => {
    beforeEach(() => {
      setupTest({
        dedup_table_quota: 'auto',
      });
    });

    it('shows current settings', async () => {
      const quotaSelect = await loader.getHarness(TnSelectHarness);
      expect(await quotaSelect.getDisplayText()).toBe('Auto');
    });

    it('saves new quota settings when dialog is submitted', async () => {
      const quotaSelect = await loader.getHarness(TnSelectHarness);
      await quotaSelect.selectOption('Auto');

      const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await submitButton.click();

      expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('pool.update', [2, {
        dedup_table_quota: NewDeduplicationQuotaSetting.Auto,
      }]);
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('custom', () => {
    beforeEach(() => {
      setupTest({
        dedup_table_quota: String(100 * MiB),
      });
    });

    it('shows current settings', async () => {
      const quotaSelect = await loader.getHarness(TnSelectHarness);
      expect(await quotaSelect.getDisplayText()).toBe('Custom');

      const quotaValue = await loader.getHarness(TnInputHarness);
      expect(await quotaValue.getValue()).toBe('100 MiB');
    });

    it('saves new quota settings when dialog is submitted', async () => {
      const quotaSelect = await loader.getHarness(TnSelectHarness);
      await quotaSelect.selectOption('Custom');

      const quotaValue = await loader.getHarness(TnInputHarness);
      await quotaValue.setValue('200 MiB');

      const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await submitButton.click();

      expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('pool.update', [2, {
        dedup_table_quota: NewDeduplicationQuotaSetting.Custom,
        dedup_table_quota_value: 200 * MiB,
      }]);
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('none', () => {
    beforeEach(() => {
      setupTest({
        dedup_table_quota: '0',
      });
    });

    it('shows current settings', async () => {
      const quotaSelect = await loader.getHarness(TnSelectHarness);
      expect(await quotaSelect.getDisplayText()).toBe('None');
    });

    it('saves new quota settings when dialog is submitted', async () => {
      const quotaSelect = await loader.getHarness(TnSelectHarness);
      await quotaSelect.selectOption('None');

      const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await submitButton.click();

      expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('pool.update', [2, {
        dedup_table_quota: null,
      }]);
      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
