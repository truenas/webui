import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';

describe('FilesystemService', () => {
  let spectator: SpectatorService<FilesystemService>;
  const createService = createServiceFactory({
    service: FilesystemService,
    providers: [
      mockWebsocket([
        mockCall('filesystem.listdir', [
          {
            path: '/mnt/parent/directory',
            name: 'directory',
            type: FileType.Directory,
          },
          {
            path: '/mnt/parent/file.txt',
            name: 'file.txt',
            type: FileType.File,
          },
        ] as FileRecord[]),
      ]),
    ],
  });

  beforeEach(() => spectator = createService());

  describe('getFilesystemNodeProvider', () => {
    it('returns a TreeNodeProvider that calls filesystem.listdir to list files and directories', async () => {
      const treeNodeProvider = spectator.service.getFilesystemNodeProvider();

      const childNodes = await lastValueFrom(
        treeNodeProvider({
          data: {
            path: '/mnt/parent',
          },
        } as TreeNode<ExplorerNodeData>),
      );

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
        'filesystem.listdir',
        ['/mnt/parent', [], { order_by: ['name'], limit: 1000 }],
      );
      expect(childNodes).toEqual([
        {
          hasChildren: true,
          name: 'directory',
          path: '/mnt/parent/directory',
          type: ExplorerNodeType.Directory,
        },
        {
          hasChildren: false,
          name: 'file.txt',
          path: '/mnt/parent/file.txt',
          type: ExplorerNodeType.File,
        },
      ]);
    });
  });
});
