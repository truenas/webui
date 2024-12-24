import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { NewDeduplicationQuotaSetting } from 'app/enums/deduplication-setting.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  SetDedupQuotaComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/set-dedup-quota/set-dedup-quota.component';
import { ApiService } from 'app/services/websocket/api.service';

describe('SetDedupQuotaComponent', () => {
  let spectator: Spectator<SetDedupQuotaComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SetDedupQuotaComponent,
    providers: [
      mockApi([
        mockJob('pool.update', fakeSuccessfulJob()),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockProvider(MatDialogRef),
    ],
  });

  async function setupTest(pool: Partial<Pool>): Promise<void> {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            id: 2,
            ...pool,
          },
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  }

  describe('auto', () => {
    beforeEach(async () => {
      await setupTest({
        dedup_table_quota: 'auto',
      });
    });

    it('shows current settings', async () => {
      expect(await form.getValues()).toEqual({
        Quota: 'Auto',
      });
    });

    it('saves new quota settings when dialog is submitted', async () => {
      await form.fillForm({
        Quota: 'Auto',
      });

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submitButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.update', [2, {
        dedup_table_quota: NewDeduplicationQuotaSetting.Auto,
      }]);
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('custom', () => {
    beforeEach(async () => {
      await setupTest({
        dedup_table_quota: String(100 * MiB),
      });
    });

    it('shows current settings', async () => {
      expect(await form.getValues()).toEqual({
        Quota: 'Custom',
        'Custom Quota': '100 MiB',
      });
    });

    it('saves new quota settings when dialog is submitted', async () => {
      await form.fillForm({
        Quota: 'Custom',
        'Custom Quota': '200 MiB',
      });

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submitButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.update', [2, {
        dedup_table_quota: NewDeduplicationQuotaSetting.Custom,
        dedup_table_quota_value: 200 * MiB,
      }]);
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('none', () => {
    beforeEach(async () => {
      await setupTest({
        dedup_table_quota: '0',
      });
    });

    it('shows current settings', async () => {
      expect(await form.getValues()).toEqual({
        Quota: 'None',
      });
    });

    it('saves new quota settings when dialog is submitted', async () => {
      await form.fillForm({
        Quota: 'None',
      });

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submitButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.update', [2, {
        dedup_table_quota: null,
      }]);
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
