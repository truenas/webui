import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { FilePickerCreateAction, FileSystemItem } from '@truenas/ui-components';
import { of } from 'rxjs';
import { emptyRootNode } from 'app/constants/basic-root-nodes.constant';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { DatasetCaseSensitivity } from 'app/enums/dataset.enum';
import { CreateDatasetActionPipe } from 'app/modules/forms/file-picker/create-dataset-action.pipe';
import { TreeNodeSource } from 'app/modules/forms/file-picker/tree-node-source';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

describe('CreateDatasetActionPipe', () => {
  let spectator: SpectatorService<CreateDatasetActionPipe>;
  let action: FilePickerCreateAction;

  const absoluteSource = new TreeNodeSource(() => of([]), [], () => undefined);
  const relativeSource = new TreeNodeSource(() => of([]), [emptyRootNode], () => undefined);
  const dataset = { path: '/mnt/tank', name: 'tank', type: 'dataset' } as FileSystemItem;
  const folder = { path: '/mnt/tank/dir', name: 'dir', type: 'folder' } as FileSystemItem;

  const parentDataset = {
    id: 'tank',
    name: 'tank',
    casesensitivity: { value: DatasetCaseSensitivity.Sensitive },
    children: [
      { name: 'tank/existing' },
    ],
  } as WebUiQueryEntity<'pool.dataset.query'>;

  const createService = createServiceFactory({
    service: CreateDatasetActionPipe,
    providers: [
      mockAuth(),
      mockTypedApi([
        mockTypedQuery('pool.dataset.query', [parentDataset]),
        mockTypedCall('pool.dataset.create', {
          mountpoint: '/mnt/tank/new',
        } as CallResponse<WebUiApiDirectory, 'pool.dataset.create'>),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    action = spectator.service.transform(absoluteSource, { comments: 'test' });
  });

  it('shows the dataset icon in the inline creation row', () => {
    expect(action.icon).toBe('tn-dataset');
  });

  describe('canCreateAt', () => {
    it('allows creation under a browsed dataset', () => {
      expect(action.canCreateAt!('/mnt/tank', dataset)).toBe(true);
    });

    it('allows creation under a dataset of a source with relative dataset names', () => {
      const relativeAction = spectator.service.transform(relativeSource);

      expect(relativeAction.canCreateAt!('/tank/child', { ...dataset, path: '/tank/child' })).toBe(true);
    });

    it('does not allow creation at the /mnt top level', () => {
      expect(action.canCreateAt!('/mnt', null)).toBe(false);
    });

    it('does not allow creation outside of /mnt', () => {
      expect(action.canCreateAt!('/dev/zvol/tank', dataset)).toBe(false);
    });

    it('does not allow creation when the browsed directory is not a dataset', () => {
      expect(action.canCreateAt!('/mnt/tank/dir', folder)).toBe(false);
      expect(action.canCreateAt!('/mnt/tank/dir', null)).toBe(false);
    });
  });

  describe('create', () => {
    it('creates the dataset under the browsed parent and resolves with its mountpoint', async () => {
      const created = await action.create!('/mnt/tank', 'new');

      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('pool.dataset.query', [['id', '=', 'tank']]);
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('pool.dataset.create', [{
        comments: 'test',
        name: 'tank/new',
      }]);
      expect(created).toBe('/mnt/tank/new');
    });

    it('maps parent and result through a source with relative dataset names', async () => {
      const created = await spectator.service.transform(relativeSource).create!('/tank', 'new');

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('pool.dataset.create', [
        expect.objectContaining({ name: 'tank/new' }),
      ]);
      expect(created).toBe('/tank/new');
    });

    it('rejects invalid dataset names', async () => {
      await expect(action.create!('/mnt/tank', 'bad/name')).rejects.toThrow('Name is invalid.');
    });

    it('rejects names that are already in use under the parent', async () => {
      await expect(action.create!('/mnt/tank', 'existing'))
        .rejects.toThrow('The name "existing" is already in use.');
    });

    it('rejects when the parent dataset does not exist', async () => {
      spectator.inject(MockTypedApiService).mockQuery('pool.dataset.query', []);

      await expect(action.create!('/mnt/gone', 'new'))
        .rejects.toThrow('Parent dataset gone not found.');
    });
  });
});
