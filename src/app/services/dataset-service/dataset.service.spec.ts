import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DatasetService } from 'app/services/dataset-service/dataset.service';

describe('DatasetService', () => {
  let spectator: SpectatorService<DatasetService>;
  const createService = createServiceFactory({
    service: DatasetService,
    providers: [
      mockApi([
        mockCall('pool.filesystem_choices', [
          'pool',
          'pool/subpool',
          'pool/anotherpool',
          'pool/subpool/subsub',
        ]),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
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

  describe('rootLevelDatasetWarning', () => {
    it('shows a dialog when the dataset is root-level', async () => {
      const dialog = await lastValueFrom(spectator.service.rootLevelDatasetWarning('/mnt/root_pool', 'msg'));
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(dialog).toBe(true);
    });

    it('returns True when the dataset is not root-level', async () => {
      const dialog = await lastValueFrom(spectator.service.rootLevelDatasetWarning('/mnt/root_pool/dataset', 'msg'));
      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
      expect(dialog).toBe(true);
    });
  });
});
