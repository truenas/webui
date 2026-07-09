import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxChipsHarness } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { UserService } from 'app/services/user.service';

describe('DatasetQuotaAddFormComponent', () => {
  let spectator: Spectator<DatasetQuotaAddFormComponent>;
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
    component: DatasetQuotaAddFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'john', roles: [] },
          { username: 'jill', roles: [] },
        ]),
        groupQueryDsCache: () => of([
          { group: 'test-group', gid: 1000 },
        ]),
        getGroupByName: jest.fn((groupName: string) => {
          if (groupName === 'test-group') {
            return of({ group: 'test-group', gid: 1000 });
          }
          return of(null);
        }),
        getGroupByNameCached: jest.fn((groupName: string) => {
          if (groupName === 'test-group') {
            return of({ group: 'test-group', gid: 1000 });
          }
          return of(null);
        }),
        getUserByName: jest.fn((username: string) => {
          if (username === 'john' || username === 'jill') {
            return of({ username, uid: username === 'john' ? 1001 : 1002 });
          }
          return of(null);
        }),
        getUserByNameCached: jest.fn((username: string) => {
          if (username === 'john' || username === 'jill') {
            return of({ username, uid: username === 'john' ? 1001 : 1002 });
          }
          return of(null);
        }),
      }),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('adding user quotas', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          quotaType: DatasetQuotaType.User,
          datasetId: 'my-dataset',
        },
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds user quotas when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await (await getTnInput('data_quota')).setValue('500M');
      await (await getTnInput('obj_quota')).setValue('2000');

      const usersInput = await form.getControl('Apply To Users') as IxChipsHarness;
      await usersInput.selectSuggestionValue('john');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', [
        'my-dataset',
        [
          { id: 'john', quota_type: DatasetQuotaType.User, quota_value: 524288000 },
          { id: 'john', quota_type: DatasetQuotaType.UserObj, quota_value: 2000 },
        ],
      ]);
    });
  });

  describe('adding group quotas', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          quotaType: DatasetQuotaType.Group,
          datasetId: 'my-dataset',
        },
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds group quotas when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Apply To Groups': ['sys', 'bin'],
      });

      await (await getTnInput('data_quota')).setValue('500M');
      await (await getTnInput('obj_quota')).setValue('2000');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', [
        'my-dataset',
        [
          { id: 'sys', quota_type: DatasetQuotaType.Group, quota_value: 524288000 },
          { id: 'sys', quota_type: DatasetQuotaType.GroupObj, quota_value: 2000 },
          { id: 'bin', quota_type: DatasetQuotaType.Group, quota_value: 524288000 },
          { id: 'bin', quota_type: DatasetQuotaType.GroupObj, quota_value: 2000 },
        ],
      ]);
    });
  });
});
