import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import {
  IxGroupChipsHarness,
  IxUserChipsHarness,
} from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { UserService } from 'app/services/user.service';

describe('DatasetQuotaAddFormComponent', () => {
  let spectator: Spectator<DatasetQuotaAddFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

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
        mockCall('zfs.resource.userspace.set', null),
        mockCall('user.get_user_obj', ([{ username }]) => ({
          pw_name: username,
          pw_uid: username === 'john' ? 1001 : 1002,
        }) as CallResponse<WebUiApiDirectory, 'user.get_user_obj'>),
        mockCall('group.get_group_obj', ([{ groupname }]) => ({
          gr_name: groupname,
          gr_gid: groupname === 'sys' ? 3 : 2,
        }) as CallResponse<WebUiApiDirectory, 'group.get_group_obj'>),
      ]),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'john', roles: [] },
          { username: 'jill', roles: [] },
        ]),
        groupQueryDsCache: () => of([
          { group: 'test-group', gid: 1000 },
        ]),
        getGroupByNameCached: jest.fn((groupName: string) => {
          if (groupName === 'test-group') {
            return of({ group: 'test-group', gid: 1000 });
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
      ...ixFormTestingProviders(),
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
      await (await getTnInput('data_quota')).setValue('500M');
      await (await getTnInput('obj_quota')).setValue('2000');

      const usersInput = await loader.getHarness(
        IxUserChipsHarness.with({ selector: '[formControlName="users"]' }),
      );
      await usersInput.selectSuggestion('john');

      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);
      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('user.get_user_obj', [{ username: 'john' }]);
      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.set', [{
        path: 'my-dataset',
        quotas: [
          {
            type: 'user', xid: 1001, quota: 524288000, objquota: 2000,
          },
        ],
      }]);
      expect(closed).toHaveBeenCalledWith(true);
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
      const groupsInput = await loader.getHarness(
        IxGroupChipsHarness.with({ selector: '[formControlName="groups"]' }),
      );
      await groupsInput.addChip('sys');
      await groupsInput.addChip('bin');

      await (await getTnInput('data_quota')).setValue('500M');
      await (await getTnInput('obj_quota')).setValue('2000');

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.set', [{
        path: 'my-dataset',
        quotas: [
          {
            type: 'group', xid: 3, quota: 524288000, objquota: 2000,
          },
          {
            type: 'group', xid: 2, quota: 524288000, objquota: 2000,
          },
        ],
      }]);
    });
  });
});
