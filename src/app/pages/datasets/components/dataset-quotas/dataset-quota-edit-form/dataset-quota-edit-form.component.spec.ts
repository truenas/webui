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
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';

describe('DatasetQuotaEditFormComponent', () => {
  let spectator: Spectator<DatasetQuotaEditFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

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
        mockCall('zfs.resource.userspace.list', [
          {
            xid: 1, quota: 512000, objquota: 0, used: 0, objused: 0,
          },
          {
            xid: 2, quota: 1024, objquota: 0, used: 0, objused: 0,
          },
        ] as CallResponse<WebUiApiDirectory, 'zfs.resource.userspace.list'>),
        mockCall('user.get_user_obj', { pw_name: 'daemon' } as CallResponse<WebUiApiDirectory, 'user.get_user_obj'>),
        mockCall('group.get_group_obj', { gr_name: 'daemon' } as CallResponse<WebUiApiDirectory, 'group.get_group_obj'>),
        mockCall('zfs.resource.userspace.set', null),
      ]),
      mockProvider(DialogService),
      ...ixFormTestingProviders(),
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
        'zfs.resource.userspace.list',
        [{ paths: ['Test'], types: ['user'] }],
      );

      expect(await (await getTnInput('name')).getValue()).toBe('daemon');
      expect(await (await getTnInput('data_quota')).getValue()).toBe('500 KiB');
      expect(await (await getTnInput('obj_quota')).getValue()).toBe('0');
    });

    it('sends an update payload to websocket when save is pressed', async () => {
      await (await getTnInput('data_quota')).setValue('1000 KiB');

      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);
      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.set', [{
        path: 'Test',
        quotas: [{
          type: 'user', xid: 1, quota: 1024000, objquota: 0,
        }],
      }]);
      expect(closed).toHaveBeenCalledWith(true);
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
        'zfs.resource.userspace.list',
        [{ paths: ['Test'], types: ['group'] }],
      );

      expect(await (await getTnInput('name')).getValue()).toBe('daemon');
      expect(await (await getTnInput('data_quota')).getValue()).toBe('500 KiB');
      expect(await (await getTnInput('obj_quota')).getValue()).toBe('0');
    });

    it('sends an update payload to websocket when save is pressed', async () => {
      await (await getTnInput('obj_quota')).setValue('1');

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.set', [{
        path: 'Test',
        quotas: [{
          type: 'group', xid: 1, quota: 512000, objquota: 1,
        }],
      }]);
    });
  });

  describe('unsetting both quotas', () => {
    let dialogService: DialogService;

    beforeEach(() => {
      spectator = createComponent({
        props: {
          quotaType: DatasetQuotaType.User,
          datasetId: 'Test',
          quotaId: 1,
        },
      });
      api = spectator.inject(ApiService);
      dialogService = spectator.inject(DialogService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('asks for confirmation when both quotas are cleared', async () => {
      const confirmSpy = jest.spyOn(dialogService, 'confirm').mockReturnValue(of(true));
      await (await getTnInput('data_quota')).setValue('0');

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Delete User Quota',
      }));
      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.set', expect.anything());
    });

    it('does not update the quota when the confirmation is declined', async () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);
      jest.spyOn(dialogService, 'confirm').mockReturnValue(of(false));
      await (await getTnInput('data_quota')).setValue('0');

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(dialogService.confirm).toHaveBeenCalled();
      expect(api.call).not.toHaveBeenCalledWith('zfs.resource.userspace.set', expect.anything());
      expect(closed).not.toHaveBeenCalled();
    });
  });
});
