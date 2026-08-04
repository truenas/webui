import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetCaseSensitivity } from 'app/enums/dataset.enum';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { ApiService } from 'app/modules/websocket/api.service';

describe('ExplorerCreateDatasetComponent', () => {
  let spectator: Spectator<ExplorerCreateDatasetComponent>;

  const datasetNode = {
    path: '/mnt/tank', name: 'tank', type: ExplorerNodeType.Directory, hasChildren: true, isMountpoint: true,
  } as ExplorerNodeData;

  const nodeAt = jest.fn((): ExplorerNodeData | undefined => datasetNode);

  const parentDataset = {
    id: 'tank',
    name: 'tank',
    casesensitivity: { value: DatasetCaseSensitivity.Sensitive },
    children: [
      { name: 'tank/existing' },
    ],
  } as Dataset;

  const createComponent = createComponentFactory({
    component: ExplorerCreateDatasetComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('pool.dataset.query', [parentDataset]),
        mockCall('pool.dataset.create', { mountpoint: '/mnt/tank/new' } as Dataset),
      ]),
      mockProvider(IxExplorerComponent, { nodeAt }),
    ],
  });

  const datasetProps = { comments: 'test' };

  beforeEach(() => {
    jest.clearAllMocks();
    nodeAt.mockReturnValue(datasetNode);
    spectator = createComponent({
      props: {
        datasetProperties: datasetProps,
      },
    });
  });

  it('allows creation for users with DatasetWrite role', () => {
    expect(spectator.component.canCreate()).toBe(true);
  });

  it('shows the dataset icon in the inline creation row', () => {
    expect(spectator.component.icon).toBe('tn-dataset');
  });

  describe('canCreateAt', () => {
    it('allows creation under a browsed dataset', () => {
      expect(spectator.component.canCreateAt('/mnt/tank')).toBe(true);
    });

    it('allows creation for relative dataset paths', () => {
      expect(spectator.component.canCreateAt('tank/child')).toBe(true);
    });

    it('does not allow creation at the /mnt top level', () => {
      expect(spectator.component.canCreateAt('/mnt')).toBe(false);
    });

    it('does not allow creation outside of /mnt', () => {
      expect(spectator.component.canCreateAt('/dev/zvol/tank')).toBe(false);
    });

    it('does not allow creation when the browsed directory is not a dataset mountpoint', () => {
      nodeAt.mockReturnValue({ ...datasetNode, isMountpoint: false });

      expect(spectator.component.canCreateAt('/mnt/tank/dir')).toBe(false);
    });
  });

  describe('createInline', () => {
    it('creates the dataset under the browsed parent and resolves with its mountpoint', async () => {
      const created = await spectator.component.createInline('/mnt/tank', 'new');

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.query', [[['id', '=', 'tank']]]);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.create', [{
        comments: 'test',
        name: 'tank/new',
      }]);
      expect(created).toBe('/mnt/tank/new');
    });

    it('rejects invalid dataset names', async () => {
      await expect(spectator.component.createInline('/mnt/tank', 'bad/name')).rejects.toThrow('Name is invalid.');
    });

    it('rejects names that are already in use under the parent', async () => {
      await expect(spectator.component.createInline('/mnt/tank', 'existing'))
        .rejects.toThrow('The name "existing" is already in use.');
    });

    it('rejects when the parent dataset does not exist', async () => {
      spectator.inject(MockApiService).mockCall('pool.dataset.query', []);

      await expect(spectator.component.createInline('/mnt/gone', 'new'))
        .rejects.toThrow('Parent dataset gone not found.');
    });
  });
});
