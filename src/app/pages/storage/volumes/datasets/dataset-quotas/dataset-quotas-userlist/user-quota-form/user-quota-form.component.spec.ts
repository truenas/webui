import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  UserQuotaFormComponent,
} from 'app/pages/storage/volumes/datasets/dataset-quotas/dataset-quotas-userlist/user-quota-form/user-quota-form.component';
import { UserService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('UserQuotaFormComponent', () => {
  let spectator: Spectator<UserQuotaFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: UserQuotaFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(UserService, {
        userQueryDsCache: () => of(),
      }),
      mockProvider(IxSlideInService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.setDatasetId('my-dataset');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('creates quotas when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'User Data Quota (Examples: 500 KiB, 500M, 2 TB)': '500M',
      'User Object Quota': 2000,
      'Apply To Users': ['jill', 'john'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.set_quota', [
      'my-dataset',
      [
        { id: 'jill', quota_type: DatasetQuotaType.User, quota_value: 524288000 },
        { id: 'jill', quota_type: DatasetQuotaType.UserObj, quota_value: '2000' },
        { id: 'john', quota_type: DatasetQuotaType.User, quota_value: 524288000 },
        { id: 'john', quota_type: DatasetQuotaType.UserObj, quota_value: '2000' },
      ],
    ]);
  });
});
