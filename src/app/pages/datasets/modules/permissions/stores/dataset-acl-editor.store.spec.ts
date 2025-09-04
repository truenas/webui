import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag, NfsAclType, NfsBasicPermission } from 'app/enums/nfs-acl.enum';
import { NfsAcl, SetAcl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { DatasetAclEditorStore } from './dataset-acl-editor.store';

describe('DatasetAclEditorStore', () => {
  let spectator: SpectatorService<DatasetAclEditorStore>;
  let store: DatasetAclEditorStore;
  let api: ApiService;

  const mockAcl: NfsAcl = {
    acltype: AclType.Nfs4,
    trivial: false,
    acl: [
      {
        tag: NfsAclTag.User,
        id: 1000,
        type: NfsAclType.Allow,
        perms: { BASIC: NfsBasicPermission.Modify },
        flags: { BASIC: 'INHERIT' },
        who: 'john',
      },
    ],
  } as NfsAcl;

  const mockStat: FileSystemStat = {
    user: 'root',
    group: 'wheel',
  } as FileSystemStat;

  const createService = createServiceFactory({
    service: DatasetAclEditorStore,
    providers: [
      mockApi([
        mockCall('filesystem.getacl', mockAcl),
        mockCall('filesystem.stat', mockStat),
        mockJob('filesystem.setacl', fakeSuccessfulJob()),
      ]),
      {
        provide: DialogService,
        useValue: {
          confirm: jest.fn(() => of(true)),
          jobDialog: jest.fn(() => ({
            afterClosed: () => of(fakeSuccessfulJob()),
          })),
        },
      },
      {
        provide: ErrorHandlerService,
        useValue: {
          showErrorModal: jest.fn(),
          withErrorHandler: () => <T>(source$: Observable<T>) => source$,
        },
      },
      {
        provide: StorageService,
        useValue: {
          isDatasetTopLevel: jest.fn(() => false),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.service;
    api = spectator.inject(ApiService);
  });

  describe('prepareSetAcl', () => {
    beforeEach(async () => {
      // Load ACL first to set up the store state
      store.loadAcl('/mnt/pool/dataset');

      // Wait a tick for the store to process
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    it('includes user and group in payload when applyOwner and applyGroup are true', async () => {
      const saveParams = {
        recursive: false,
        traverse: false,
        owner: 'newowner',
        ownerGroup: 'newgroup',
        applyOwner: true,
        applyGroup: true,
      };

      store.saveAcl(saveParams);

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(api.job).toHaveBeenCalledWith(
        'filesystem.setacl',
        [expect.objectContaining({
          user: 'newowner',
          group: 'newgroup',
          path: '/mnt/pool/dataset',
          acltype: AclType.Nfs4,
        } as SetAcl)],
      );
    });

    it('excludes user from payload when applyOwner is false', async () => {
      const saveParams = {
        recursive: false,
        traverse: false,
        owner: 'newowner',
        ownerGroup: 'newgroup',
        applyOwner: false,
        applyGroup: true,
      };

      store.saveAcl(saveParams);

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(api.job).toHaveBeenCalledWith(
        'filesystem.setacl',
        [expect.objectContaining({
          group: 'newgroup',
          path: '/mnt/pool/dataset',
          acltype: AclType.Nfs4,
        } as SetAcl)],
      );

      const callArgs = (api.job as jest.Mock).mock.calls[0][1][0];
      expect(callArgs).not.toHaveProperty('user');
    });

    it('excludes group from payload when applyGroup is false', async () => {
      const saveParams = {
        recursive: false,
        traverse: false,
        owner: 'newowner',
        ownerGroup: 'newgroup',
        applyOwner: true,
        applyGroup: false,
      };

      store.saveAcl(saveParams);

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(api.job).toHaveBeenCalledWith(
        'filesystem.setacl',
        [expect.objectContaining({
          user: 'newowner',
          path: '/mnt/pool/dataset',
          acltype: AclType.Nfs4,
        } as SetAcl)],
      );

      const callArgs = (api.job as jest.Mock).mock.calls[0][1][0];
      expect(callArgs).not.toHaveProperty('group');
    });

    it('excludes both user and group from payload when both checkboxes are false', async () => {
      const saveParams = {
        recursive: false,
        traverse: false,
        owner: 'newowner',
        ownerGroup: 'newgroup',
        applyOwner: false,
        applyGroup: false,
      };

      store.saveAcl(saveParams);

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(api.job).toHaveBeenCalledWith(
        'filesystem.setacl',
        [expect.objectContaining({
          path: '/mnt/pool/dataset',
          acltype: AclType.Nfs4,
        } as SetAcl)],
      );

      const callArgs = (api.job as jest.Mock).mock.calls[0][1][0];
      expect(callArgs).not.toHaveProperty('user');
      expect(callArgs).not.toHaveProperty('group');
    });

    it('sets recursive and traverse options correctly', async () => {
      const saveParams = {
        recursive: true,
        traverse: true,
        owner: 'newowner',
        ownerGroup: 'newgroup',
        applyOwner: true,
        applyGroup: true,
      };

      store.saveAcl(saveParams);

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(api.job).toHaveBeenCalledWith(
        'filesystem.setacl',
        [expect.objectContaining({
          options: expect.objectContaining({
            recursive: true,
            traverse: true,
            validate_effective_acl: true,
          }),
        } as SetAcl)],
      );
    });
  });
});

