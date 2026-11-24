import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { firstValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { DatasetQuotaService } from 'app/services/dataset/dataset-quota.service';

type UserspaceRows = CallResponse<WebUiApiDirectory, 'zfs.resource.userspace.list'>;

const rows = [
  {
    dataset: 'dozer/data', type: 'user', xid: 1000, used: 512, quota: 1024, objused: 3, objquota: 10,
  },
  {
    dataset: 'dozer/data', type: 'user', xid: 1001, used: 100, quota: 0, objused: 1, objquota: 0,
  },
] as UserspaceRows;

describe('DatasetQuotaService', () => {
  let spectator: SpectatorService<DatasetQuotaService>;
  let api: ApiService;

  const createService = createServiceFactory({
    service: DatasetQuotaService,
    providers: [
      mockApi([
        mockCall('zfs.resource.userspace.list', rows),
        mockCall('zfs.resource.userspace.set', null),
        mockCall('user.get_user_obj', (params) => ({
          pw_name: params[0]?.uid !== undefined ? `user${params[0].uid}` : '',
          pw_uid: params[0]?.username === 'john' ? 1000 : 0,
        } as CallResponse<WebUiApiDirectory, 'user.get_user_obj'>)),
        mockCall('group.get_group_obj', (params) => ({
          gr_name: `group${params[0]?.gid ?? ''}`,
          gr_gid: params[0]?.groupname === 'staff' ? 50 : 0,
        } as CallResponse<WebUiApiDirectory, 'group.get_group_obj'>)),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(ApiService);
  });

  describe('getQuotas', () => {
    it('reads the rows that have a limit and looks up only their names', async () => {
      const quotas = await firstValueFrom(spectator.service.getQuotas('dozer/data', DatasetQuotaType.User));

      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.list', [{ paths: ['dozer/data'], types: ['user'] }]);
      expect(api.call).toHaveBeenCalledWith('user.get_user_obj', [{ uid: 1000 }]);
      expect(api.call).not.toHaveBeenCalledWith('user.get_user_obj', [{ uid: 1001 }]);
      expect(quotas).toEqual([
        {
          id: 1000,
          name: 'user1000',
          quota_type: DatasetQuotaType.User,
          quota: 1024,
          used_bytes: 512,
          used_percent: 50,
          obj_quota: 10,
          obj_used: 3,
        },
      ]);
    });

    it('includes usage-only rows, with their names, when asked to', async () => {
      const quotas = await firstValueFrom(
        spectator.service.getQuotas('dozer/data', DatasetQuotaType.User, { includeUsageOnly: true }),
      );

      expect(api.call).toHaveBeenCalledWith('user.get_user_obj', [{ uid: 1001 }]);
      expect(quotas).toEqual([
        expect.objectContaining({ id: 1000, name: 'user1000' }),
        {
          id: 1001,
          name: 'user1001',
          quota_type: DatasetQuotaType.User,
          quota: 0,
          used_bytes: 100,
          used_percent: 0,
          obj_quota: 0,
          obj_used: 1,
        },
      ]);
    });

    it('looks up group names for group quotas', async () => {
      const quotas = await firstValueFrom(spectator.service.getQuotas('dozer/data', DatasetQuotaType.Group));

      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.list', [{ paths: ['dozer/data'], types: ['group'] }]);
      expect(quotas[0].name).toBe('group1000');
    });

    it('has no name for an account that no longer exists', async () => {
      spectator.inject(MockApiService).mockCallError('user.get_user_obj', {
        reason: '1000: user with this id does not exist',
      });

      const quotas = await firstValueFrom(spectator.service.getQuotas('dozer/data', DatasetQuotaType.User));

      expect(quotas.map((quota) => quota.name)).toEqual([null]);
    });

    it('shows the id when the name cannot be looked up for another reason', async () => {
      spectator.inject(MockApiService).mockCallError('user.get_user_obj', {
        errname: 'EACCES',
        reason: 'Not authorized',
      });

      const quotas = await firstValueFrom(spectator.service.getQuotas('dozer/data', DatasetQuotaType.User));

      expect(quotas.map((quota) => quota.name)).toEqual(['1000']);
    });

    it('returns nothing without asking for names when there are no rows', async () => {
      spectator.inject(MockApiService).mockCall('zfs.resource.userspace.list', []);

      expect(await firstValueFrom(spectator.service.getQuotas('dozer/data', DatasetQuotaType.User))).toEqual([]);
      expect(api.call).not.toHaveBeenCalledWith('user.get_user_obj', expect.anything());
    });
  });

  describe('getQuota', () => {
    it('reads one account\'s quota and looks up only that account', async () => {
      const quotas = await firstValueFrom(spectator.service.getQuota('dozer/data', DatasetQuotaType.User, 1001));

      expect(quotas).toEqual([expect.objectContaining({ id: 1001, name: 'user1001', obj_used: 1 })]);
      expect(api.call).toHaveBeenCalledWith('user.get_user_obj', [{ uid: 1001 }]);
      expect(api.call).not.toHaveBeenCalledWith('user.get_user_obj', [{ uid: 1000 }]);
    });
  });

  describe('countQuotas', () => {
    it('counts the accounts with a limit without looking up any names', async () => {
      expect(await firstValueFrom(spectator.service.countQuotas('dozer/data', DatasetQuotaType.User))).toBe(1);
      expect(api.call).not.toHaveBeenCalledWith('user.get_user_obj', expect.anything());
    });
  });

  describe('setQuotas', () => {
    it('merges data and object quotas of one user into one entry, looking up names', async () => {
      await firstValueFrom(spectator.service.setQuotas('dozer/data', [
        { id: 'john', quota_type: DatasetQuotaType.User, quota_value: 2048 },
        { id: 'john', quota_type: DatasetQuotaType.UserObj, quota_value: 100 },
        { id: '1001', quota_type: DatasetQuotaType.User, quota_value: 0 },
      ]));

      expect(api.call).toHaveBeenCalledWith('user.get_user_obj', [{ username: 'john' }]);
      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.set', [{
        path: 'dozer/data',
        quotas: [
          {
            type: 'user', xid: 1000, quota: 2048, objquota: 100,
          },
          { type: 'user', xid: 1001, quota: 0 },
        ],
      }]);
    });

    it('sets group quotas by gid', async () => {
      await firstValueFrom(spectator.service.setQuotas('dozer/data', [
        { id: 'staff', quota_type: DatasetQuotaType.GroupObj, quota_value: 5 },
      ]));

      expect(api.call).toHaveBeenCalledWith('group.get_group_obj', [{ groupname: 'staff' }]);
      expect(api.call).toHaveBeenCalledWith('zfs.resource.userspace.set', [{
        path: 'dozer/data',
        quotas: [{ type: 'group', xid: 50, objquota: 5 }],
      }]);
    });

    it('does nothing for an empty list', async () => {
      await firstValueFrom(spectator.service.setQuotas('dozer/data', []));

      expect(api.call).not.toHaveBeenCalledWith('zfs.resource.userspace.set', expect.anything());
    });
  });
});
