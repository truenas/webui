import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxChipsHarness } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { UserService } from 'app/services/user.service';

describe('DatasetQuotaAddFormComponent', () => {
  let spectator: Spectator<DatasetQuotaAddFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<{ quotaType: DatasetQuotaType; datasetId: string } | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

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
      mockProvider(SlideIn),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const clickSave = async (): Promise<void> => {
    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();
  };

  describe('adding user quotas', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ quotaType: DatasetQuotaType.User, datasetId: 'my-dataset' })) }),
        ],
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds user quotas when form is submitted', async () => {
      await (await getInput('data_quota')).setValue('500M');
      await (await getInput('obj_quota')).setValue('2000');

      const usersInput = await loader.getHarness(IxChipsHarness.with({ label: 'Apply To Users' }));
      await usersInput.selectSuggestionValue('john');

      await clickSave();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', [
        'my-dataset',
        [
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
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => ({ quotaType: DatasetQuotaType.Group, datasetId: 'my-dataset' })) }),
        ],
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('adds group quotas when form is submitted', async () => {
      await (await getInput('data_quota')).setValue('500M');
      await (await getInput('obj_quota')).setValue('2000');

      const groupsInput = await loader.getHarness(IxChipsHarness.with({ label: 'Apply To Groups' }));
      await groupsInput.setValue(['sys', 'bin']);

      await clickSave();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', [
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
