import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { FilePickerCreateAction, FileSystemItem } from '@truenas/ui-components';
import { of } from 'rxjs';
import { emptyRootNode } from 'app/constants/basic-root-nodes.constant';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CreateDatasetActionPipe } from 'app/modules/forms/file-picker/create-dataset-action.pipe';
import { TreeNodeSource } from 'app/modules/forms/file-picker/tree-node-source';
import { ApiService } from 'app/modules/websocket/api.service';
import { ZfsResourceEntry } from 'app/services/dataset/zfs-resource.utils';

describe('CreateDatasetActionPipe', () => {
  let spectator: SpectatorService<CreateDatasetActionPipe>;
  let action: FilePickerCreateAction;

  const absoluteSource = new TreeNodeSource(() => of([]), [], () => undefined);
  const relativeSource = new TreeNodeSource(() => of([]), [emptyRootNode], () => undefined);
  const dataset = { path: '/mnt/tank', name: 'tank', type: 'dataset' } as FileSystemItem;
  const folder = { path: '/mnt/tank/dir', name: 'dir', type: 'folder' } as FileSystemItem;

  const parentDataset = {
    name: 'tank',
    type: 'FILESYSTEM',
    properties: {
      casesensitivity: { raw: 'sensitive', value: 'sensitive', source: null },
    },
    children: [
      { name: 'tank/existing', type: 'FILESYSTEM' },
    ],
  } as ZfsResourceEntry;

  /** Answers the parent lookup, and the read-back of whatever was just created. */
  function listDatasets([query]: [{ paths?: string[] }?]): ZfsResourceEntry[] {
    const path = query?.paths?.[0];
    if (path === 'tank') {
      return [parentDataset];
    }
    return [{
      name: path,
      type: 'FILESYSTEM',
      properties: { mountpoint: { raw: `/mnt/${path}`, value: `/mnt/${path}`, source: null } },
    } as ZfsResourceEntry];
  }

  const createService = createServiceFactory({
    service: CreateDatasetActionPipe,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('zfs.resource.list', listDatasets),
        mockCall('zfs.resource.create', {} as ZfsResourceEntry),
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

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('zfs.resource.list', [
        expect.objectContaining({ paths: ['tank'], max_depth: 1, nest_results: true }),
      ]);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('zfs.resource.create', [expect.objectContaining({
        path: 'tank/new',
        user_properties: { 'org.freenas:description': 'test' },
      })]);
      expect(created).toBe('/mnt/tank/new');
    });

    it('maps parent and result through a source with relative dataset names', async () => {
      const created = await spectator.service.transform(relativeSource).create!('/tank', 'new');

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('zfs.resource.create', [
        expect.objectContaining({ path: 'tank/new' }),
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
      spectator.inject(MockApiService).mockCall('zfs.resource.list', []);

      await expect(action.create!('/mnt/gone', 'new'))
        .rejects.toThrow('Parent dataset gone not found.');
    });
  });
});
