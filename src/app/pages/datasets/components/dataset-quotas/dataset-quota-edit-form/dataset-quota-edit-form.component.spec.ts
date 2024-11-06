import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DatasetQuotaEditFormComponent', () => {
  let spectator: Spectator<DatasetQuotaEditFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: DatasetQuotaEditFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('pool.dataset.get_quota', [{
          id: 1,
          name: 'daemon',
          quota: 512000,
          obj_quota: 0,
        } as DatasetQuota]),
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(SlideInService),
      mockProvider(DialogService),
      mockProvider(IxFormatterService, {
        memorySizeFormatting: jest.fn(() => '500 KiB'),
        memorySizeParsing: jest.fn(() => 1024000),
      }),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
