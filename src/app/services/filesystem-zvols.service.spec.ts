import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom, of, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { FileAttribute } from 'app/enums/file-attribute.enum';
import { FileType } from 'app/enums/file-type.enum';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApiCallError } from 'app/services/errors/error.classes';
import { FilesystemService } from 'app/services/filesystem.service';

describe('FilesystemService - getTreeNodeProvider - zvols support', () => {
  let spectator: SpectatorService<FilesystemService>;

  const createService = createServiceFactory({
    service: FilesystemService,
    providers: [
      mockApi([]),
    ],
  });

  describe('/dev/zvol does not exist', () => {
    beforeEach(() => {
      spectator = createService();

      const mockedApi = spectator.inject(MockApiService);
      jest.spyOn(mockedApi, 'call').mockImplementation((method, args) => {
        if (method !== 'filesystem.listdir') {
          throw new Error(`Unexpected API call: ${method} with args ${JSON.stringify(args)}`);
        }

        if ((args as string[])[0] === '/dev/zvol') {
          return throwError(() => new ApiCallError({ data: { reason: '[ENOENT] Directory /dev/zvol does not exist' } } as JsonRpcError));
        }

        return of([
          {
            path: '/mnt/parent',
            name: 'parent',
            type: FileType.Directory,
            attributes: [FileAttribute.MountRoot],
          },
        ]);
      });
    });

    it('returns a TreeNodeProvider that shows dataset tree under /dev/zvol', async () => {
      const treeNodeProvider = spectator.service.getFilesystemNodeProvider({ zvolsOnly: true });

      const childNodes = await lastValueFrom(
        treeNodeProvider({
          data: {
            path: '/dev/zvol',
          },
        } as TreeNode<ExplorerNodeData>),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(2);
      expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(
        1,
        'filesystem.listdir',
        ['/dev/zvol', [], {
          select: ['attributes', 'is_ctldir', 'name', 'path', 'type'],
          order_by: ['name'],
          limit: 1000,
        }],
      );
      expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(
        2,
        'filesystem.listdir',
        [
          '/mnt/',
          [['type', '=', FileType.Directory]],
          {
            select: ['attributes', 'is_ctldir', 'name', 'path', 'type'],
            order_by: ['name'],
            limit: 1000,
          },
        ],
      );

      expect(childNodes).toEqual([
        {
          hasChildren: true,
          isLock: false,
          isMountpoint: true,
          name: 'parent',
          path: '/dev/zvol/parent',
          type: ExplorerNodeType.Directory,
        },
      ]);
    });
  });

  describe('it mixes zvol and dataset trees', () => {
    beforeEach(() => {
      spectator = createService();

      const mockedApi = spectator.inject(MockApiService);
      jest.spyOn(mockedApi, 'call').mockImplementation((method, args) => {
        if (method !== 'filesystem.listdir') {
          throw new Error(`Unexpected API call: ${method} with args ${JSON.stringify(args)}`);
        }

        if ((args as string[])[0] === '/dev/zvol/parent') {
          return of([
            {
              path: '/dev/zvol/parent/zvol',
              name: 'parent',
              type: FileType.Symlink,
              attributes: [],
            },
          ]);
        }

        return of([
          {
            path: '/mnt/parent/nested',
            name: 'parent',
            type: FileType.Directory,
            attributes: [FileAttribute.MountRoot],
          },
        ]);
      });
    });

    it('returns a TreeNodeProvider that mixes zvols and directories', async () => {
      const treeNodeProvider = spectator.service.getFilesystemNodeProvider({ zvolsOnly: true });

      const childNodes = await lastValueFrom(
        treeNodeProvider({
          data: {
            path: '/dev/zvol/parent',
          },
        } as TreeNode<ExplorerNodeData>),
      );

      expect(childNodes).toEqual([
        {
          hasChildren: true,
          isLock: false,
          isMountpoint: true,
          name: 'parent',
          path: '/dev/zvol/parent/nested',
          type: 'directory',
        },
        {
          hasChildren: false,
          isLock: false,
          isMountpoint: false,
          name: 'parent',
          path: '/dev/zvol/parent/zvol',
          type: 'symlink',
        },
      ]);
    });
  });
});
