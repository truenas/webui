import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DatasetQuotaEditFormComponent', () => {
  let spectator: Spectator<DatasetQuotaEditFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: DatasetQuotaEditFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.get_quota', [{
          id: 1,
          name: 'daemon',
          quota: 512000,
          obj_quota: 0,
        } as DatasetQuota]),
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      mockProvider(IxFormatterService, {
        memorySizeFormatting: jest.fn(() => '500 KiB'),
        memorySizeParsing: jest.fn(() => 1024000),
      }),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('editing user quota', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              quotaType: DatasetQuotaType.User,
              datasetId: 'Test',
              id: 1,
            },
          },
        ],
      });
      ws = spectator.inject(WebSocketService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows current quota values when editing', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(ws.call).toHaveBeenCalledWith(
        'pool.dataset.get_quota',
        ['Test', DatasetQuotaType.User, [['id', '=', 1]]],
      );

      expect(values).toEqual({
        User: 'daemon',
        'User Data Quota (Examples: 500 KiB, 500M, 2 TB)': '500 KiB',
        'User Object Quota': '0',
      });
    });

    it('sends an update payload to websocket and closes slide when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        'User Data Quota (Examples: 500 KiB, 500M, 2 TB)': '1000 KiB',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('pool.dataset.set_quota', ['Test', [
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
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('editing group quota', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              quotaType: DatasetQuotaType.Group,
              datasetId: 'Test',
              id: 1,
            },
          },
        ],
      });
      ws = spectator.inject(WebSocketService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows current quota values when editing', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(ws.call).toHaveBeenCalledWith(
        'pool.dataset.get_quota',
        ['Test', DatasetQuotaType.Group, [['id', '=', 1]]],
      );

      expect(values).toEqual({
        Group: 'daemon',
        'Group Data Quota (Examples: 500 KiB, 500M, 2 TB)': '500 KiB',
        'Group Object Quota': '0',
      });
    });

    it('sends an update payload to websocket and closes slide when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        'Group Object Quota': 1,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('pool.dataset.set_quota', ['Test', [
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
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });
});
