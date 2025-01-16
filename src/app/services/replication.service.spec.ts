import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReplicationService } from 'app/services/replication.service';

describe('ReplicationService', () => {
  let spectator: SpectatorService<ReplicationService>;
  const createService = createServiceFactory({
    service: ReplicationService,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('replication.list_datasets', [
          'parent',
          'parent/child1',
          'parent/child2',
          'parent/child2/subchild',
          'parent2',
          'parent2/child1',
          'parent2/child2',
        ]),
      ]),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => spectator = createService());

  describe('getTreeNodeProvider', () => {
    it('returns a TreeNodeProvider that calls replication.list_datasets to list datasets', async () => {
      const treeNodeProvider = spectator.service.getTreeNodeProvider({
        transport: TransportMode.Ssh,
        sshCredential: 2,
      });

      const childNodes = await firstValueFrom(
        treeNodeProvider({
          data: {
            path: 'parent',
          },
        } as TreeNode<ExplorerNodeData>),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'replication.list_datasets',
        [TransportMode.Ssh, 2],
      );
      expect(childNodes).toEqual([
        {
          hasChildren: false,
          name: 'child1',
          path: 'parent/child1',
          type: ExplorerNodeType.Directory,
        },
        {
          hasChildren: true,
          name: 'child2',
          path: 'parent/child2',
          type: ExplorerNodeType.Directory,
        },
      ]);
    });

    it('returns root level nodes when called with empty path', async () => {
      const treeNodeProvider = spectator.service.getTreeNodeProvider({
        transport: TransportMode.Ssh,
        sshCredential: 2,
      });

      const nodes = await firstValueFrom(
        treeNodeProvider({
          data: {
            path: '',
          },
        } as TreeNode<ExplorerNodeData>),
      );

      expect(nodes).toEqual([
        {
          hasChildren: true,
          name: 'parent',
          path: 'parent',
          type: ExplorerNodeType.Directory,
        },
        {
          hasChildren: true,
          name: 'parent2',
          path: 'parent2',
          type: ExplorerNodeType.Directory,
        },
      ]);
    });

    it('only calls replication.list_datasets once when treeNodeProvider is called', async () => {
      const treeNodeProvider = spectator.service.getTreeNodeProvider({
        transport: TransportMode.Ssh,
        sshCredential: 2,
      });

      await firstValueFrom(
        treeNodeProvider({
          data: {
            path: '',
          },
        } as TreeNode<ExplorerNodeData>),
      );
      await firstValueFrom(
        treeNodeProvider({
          data: {
            path: '',
          },
        } as TreeNode<ExplorerNodeData>),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });
  });
});
