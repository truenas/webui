import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { DatasetService } from 'app/services/dataset-service/dataset.service';

describe('DatasetService', () => {
  let spectator: SpectatorService<DatasetService>;
  const createService = createServiceFactory({
    service: DatasetService,
    providers: [
      mockWebsocket([
        mockCall('pool.filesystem_choices', [
          'pool',
          'pool/subpool',
          'pool/anotherpool',
          'pool/subpool/subsub',
        ]),
      ]),
    ],
  });

  beforeEach(() => spectator = createService());

  it('returns a TreeNodeProvider that lists dataset nodes', async () => {
    const provider = spectator.service.getDatasetNodeProvider();

    const nodes = await lastValueFrom(provider({ } as TreeNode<ExplorerNodeData>));
    expect(nodes).toEqual([
      {
        hasChildren: true,
        name: 'pool',
        path: 'pool',
        type: ExplorerNodeType.Directory,
        children: [
          {
            hasChildren: true,
            name: 'subpool',
            path: 'pool/subpool',
            type: ExplorerNodeType.Directory,
            children: [
              {
                hasChildren: false,
                name: 'subsub',
                path: 'pool/subpool/subsub',
                type: ExplorerNodeType.Directory,
                children: [],
              },
            ],
          },
          {
            children: [],
            hasChildren: false,
            name: 'anotherpool',
            path: 'pool/anotherpool',
            type: ExplorerNodeType.Directory,
          },
        ],
      },
    ]);
  });
});
