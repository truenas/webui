import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetApiService } from 'app/services/dataset/dataset-api.service';
import { datasetProperties, ZfsResourceEntry } from 'app/services/dataset/zfs-resource.utils';

const row = {
  name: 'dozer/data',
  pool: 'dozer',
  type: 'FILESYSTEM',
  properties: {
    mountpoint: { raw: '/mnt/dozer/data', value: '/mnt/dozer/data', source: null },
  },
  user_properties: {},
  children: null,
} as unknown as ZfsResourceEntry;

describe('DatasetApiService', () => {
  let spectator: SpectatorService<DatasetApiService>;
  let api: ApiService;

  const createService = createServiceFactory({
    service: DatasetApiService,
    providers: [
      mockApi([
        mockCall('zfs.resource.list', [row]),
        mockCall('zfs.resource.create', row),
        mockCall('zfs.resource.set', row),
        mockCall('zfs.resource.destroy', null),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(ApiService);
  });

  it('reads datasets with their properties, sources and user properties', async () => {
    const datasets = await firstValueFrom(spectator.service.loadDatasets(['dozer/data']));

    expect(api.call).toHaveBeenCalledWith('zfs.resource.list', [{
      paths: ['dozer/data'],
      properties: datasetProperties,
      get_source: true,
      get_user_properties: true,
    }]);
    expect(datasets).toEqual([expect.objectContaining({ id: 'dozer/data', mountpoint: '/mnt/dozer/data' })]);
  });

  it('reads immediate children when asked to', async () => {
    await firstValueFrom(spectator.service.loadDatasets(['dozer/data'], { withChildren: true }));

    expect(api.call).toHaveBeenCalledWith('zfs.resource.list', [expect.objectContaining({
      paths: ['dozer/data'],
      max_depth: 1,
      nest_results: true,
    })]);
  });

  it('fails to load a dataset that does not exist', async () => {
    spectator.inject(MockApiService).mockCall('zfs.resource.list', []);

    await expect(firstValueFrom(spectator.service.loadDataset('dozer/missing')))
      .rejects.toThrow('Dataset dozer/missing does not exist.');
  });

  it('creates a dataset and reads it back', async () => {
    const dataset = await firstValueFrom(spectator.service.createDataset({
      name: 'dozer/data',
      compression: 'LZ4',
    } as DatasetCreate));

    expect(api.call).toHaveBeenCalledWith('zfs.resource.create', [expect.objectContaining({
      path: 'dozer/data',
      properties: { compression: 'lz4' },
    })]);
    expect(api.call).toHaveBeenCalledWith('zfs.resource.list', [expect.objectContaining({ paths: ['dozer/data'] })]);
    expect(dataset.id).toBe('dozer/data');
  });

  it('updates a dataset and reads it back', async () => {
    await firstValueFrom(spectator.service.updateDataset('dozer/data', { atime: 'INHERIT' }));

    expect(api.call).toHaveBeenCalledWith('zfs.resource.set', [expect.objectContaining({
      path: 'dozer/data',
      inherit: ['atime'],
    })]);
    expect(api.call).toHaveBeenCalledWith('zfs.resource.list', [expect.objectContaining({ paths: ['dozer/data'] })]);
  });

  it('destroys a dataset recursively', async () => {
    await firstValueFrom(spectator.service.deleteDataset('dozer/data'));

    expect(api.call).toHaveBeenCalledWith('zfs.resource.destroy', [{ path: 'dozer/data', recursive: true }]);
  });
});
