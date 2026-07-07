import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';

describe('DatasetQuotaEditFormComponent', () => {
  let spectator: Spectator<DatasetQuotaEditFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: DatasetQuotaEditFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('pool.dataset.get_quota', [{
          id: 1,
          name: 'daemon',
          quota: 512000,
          obj_quota: 0,
        } as DatasetQuota]),
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('editing user quota', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          quotaType: DatasetQuotaType.User,
          datasetId: 'Test',
          quotaId: 1,
        },
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows current quota values when editing', async () => {
      expect(api.call).toHaveBeenCalledWith(
        'pool.dataset.get_quota',
        ['Test', DatasetQuotaType.User, [['id', '=', 1]]],
      );

      expect(await (await getTnInput('name')).getValue()).toBe('daemon');
      expect(await (await getTnInput('data_quota')).getValue()).toBe('500 KiB');
      expect(await (await getTnInput('obj_quota')).getValue()).toBe('0');
    });

    it('sends an update payload to websocket and closes slide when save is pressed', async () => {
      await (await getTnInput('data_quota')).setValue('1000 KiB');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', ['Test', [
        {
          quota_type: DatasetQuotaType.User,
          id: '1',
          quota_value: 1024000,
        },
        {
          quota_type: DatasetQuotaType.UserObj,
          id: '1',
          quota_value: 0,
        },
      ]]);
    });
  });

  describe('editing group quota', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          quotaType: DatasetQuotaType.Group,
          datasetId: 'Test',
          quotaId: 1,
        },
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows current quota values when editing', async () => {
      expect(api.call).toHaveBeenCalledWith(
        'pool.dataset.get_quota',
        ['Test', DatasetQuotaType.Group, [['id', '=', 1]]],
      );

      expect(await (await getTnInput('name')).getValue()).toBe('daemon');
      expect(await (await getTnInput('data_quota')).getValue()).toBe('500 KiB');
      expect(await (await getTnInput('obj_quota')).getValue()).toBe('0');
    });

    it('sends an update payload to websocket and closes slide when save is pressed', async () => {
      await (await getTnInput('obj_quota')).setValue('1');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', ['Test', [
        {
          quota_type: DatasetQuotaType.Group,
          id: '1',
          quota_value: 512000,
        },
        {
          quota_type: DatasetQuotaType.GroupObj,
          id: '1',
          quota_value: 1,
        },
      ]]);
    });
  });
});
