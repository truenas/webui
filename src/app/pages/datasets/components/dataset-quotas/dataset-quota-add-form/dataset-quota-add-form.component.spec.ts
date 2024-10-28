import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DatasetQuotaAddFormComponent', () => {
  let spectator: Spectator<DatasetQuotaAddFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: DatasetQuotaAddFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(UserService, {
        userQueryDsCache: () => of(),
        groupQueryDsCache: () => of(),
      }),
      mockProvider(SlideInService),
      mockProvider(DialogService),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
    ],
  });

  describe('adding user quotas', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              quotaType: DatasetQuotaType.User,
              datasetId: 'my-dataset',
            },
          },
        ],
      });
      ws = spectator.inject(WebSocketService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds user quotas when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        'User Data Quota (Examples: 500 KiB, 500M, 2 TB)': '500M',
        'User Object Quota': 2000,
        'Apply To Users': ['jill', 'john'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('pool.dataset.set_quota', [
        'my-dataset',
        [
          { id: 'jill', quota_type: DatasetQuotaType.User, quota_value: 524288000 },
          { id: 'jill', quota_type: DatasetQuotaType.UserObj, quota_value: 2000 },
          { id: 'john', quota_type: DatasetQuotaType.User, quota_value: 524288000 },
          { id: 'john', quota_type: DatasetQuotaType.UserObj, quota_value: 2000 },
        ],
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('adding group quotas', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              quotaType: DatasetQuotaType.Group,
              datasetId: 'my-dataset',
            },
          },
        ],
      });
      ws = spectator.inject(WebSocketService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds group quotas when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Group Data Quota (Examples: 500 KiB, 500M, 2 TB)': '500M',
        'Group Object Quota': 2000,
        'Apply To Groups': ['sys', 'bin'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('pool.dataset.set_quota', [
        'my-dataset',
        [
          { id: 'sys', quota_type: DatasetQuotaType.Group, quota_value: 524288000 },
          { id: 'sys', quota_type: DatasetQuotaType.GroupObj, quota_value: 2000 },
          { id: 'bin', quota_type: DatasetQuotaType.Group, quota_value: 524288000 },
          { id: 'bin', quota_type: DatasetQuotaType.GroupObj, quota_value: 2000 },
        ],
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
