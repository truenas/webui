import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { FileAttribute } from 'app/enums/file-attribute.enum';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { FilesystemService } from 'app/services/filesystem.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('FilesystemService', () => {
  let spectator: SpectatorService<FilesystemService>;
  const createService = createServiceFactory({
    service: FilesystemService,
    providers: [
      mockApi([
        mockCall('filesystem.listdir', [
          {
            path: '/mnt/parent/directory',
            name: 'directory',
            type: FileType.Directory,
            attributes: [FileAttribute.MountRoot],
          },
          {
            path: '/mnt/parent/file.txt',
            name: 'file.txt',
            type: FileType.File,
            attributes: [FileAttribute.Immutable],
          },
          {
            path: '/mnt/parent/zvol',
            name: 'zvol',
            type: FileType.Symlink,
            attributes: [FileAttribute.Immutable],
          },
        ] as FileRecord[]),
      ]),
    ],
  });

  beforeEach(() => spectator = createService());

  describe('getFilesystemNodeProvider', () => {
    it('returns a TreeNodeProvider that calls filesystem.listdir to list files and directories', async () => {
      const treeNodeProvider = spectator.service.getFilesystemNodeProvider({ datasetsAndZvols: true });

      const childNodes = await lastValueFrom(
        treeNodeProvider({
          data: {
            path: '/mnt/parent',
          },
        } as TreeNode<ExplorerNodeData>),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'filesystem.listdir',
        ['/mnt/parent', [], {
          select: ['attributes', 'is_ctldir', 'name', 'path', 'type'],
          order_by: ['name'],
          limit: 1000,
        }],
      );
      expect(childNodes).toEqual([
        {
          hasChildren: true,
          name: 'directory',
          path: '/mnt/parent/directory',
          type: ExplorerNodeType.Directory,
          isMountpoint: true,
          isLock: false,
        },
        {
          hasChildren: false,
          name: 'file.txt',
          path: '/mnt/parent/file.txt',
          type: ExplorerNodeType.File,
          isMountpoint: false,
          isLock: true,
        },
        {
          hasChildren: false,
          name: 'zvol',
          path: '/mnt/parent/zvol',
          type: ExplorerNodeType.Symlink,
          isMountpoint: false,
          isLock: true,
        },
      ]);
    });
  });
});
