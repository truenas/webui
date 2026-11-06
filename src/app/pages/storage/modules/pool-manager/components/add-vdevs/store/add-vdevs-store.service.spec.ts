import { signal } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockQuery, settleApi } from 'app/core/testing/utils/mock-api.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('AddVdevsStore', () => {
  let spectator: SpectatorService<AddVdevsStore>;

  const usedDisks = [
    { devname: 'sda', imported_zpool: 'tank' },
    { devname: 'sdb', imported_zpool: 'other' },
  ] as DetailsDisk[];

  const createService = createServiceFactory({
    service: AddVdevsStore,
    providers: [
      mockApi([
        mockQuery('pool.query', [{ id: 5, name: 'tank', topology: {} }] as WebUiQueryEntity<'pool.query'>[]),
      ]),
      mockProvider(DiskStore, {
        usedDisks: signal(usedDisks),
      }),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('loads the pool and exposes the disks it is imported on', async () => {
    spectator.service.loadPoolData(5);
    expect(spectator.service.isLoading()).toBe(true);
    await settleApi();

    expect(spectator.inject(ApiService).query).toHaveBeenCalledWith('pool.query', [['id', '=', 5]]);
    expect(spectator.service.pool()).toMatchObject({ id: 5, name: 'tank' });
    expect(spectator.service.poolDisks()).toEqual([usedDisks[0]]);
    expect(spectator.service.isLoading()).toBe(false);
  });

  it('clears the loading flag and shows the error when the pool cannot be loaded', async () => {
    const error = new Error('Failed');
    jest.spyOn(spectator.inject(MockApiService), 'query').mockReturnValue(throwError(() => error));

    spectator.service.loadPoolData(5);
    await settleApi();

    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(error);
    expect(spectator.service.isLoading()).toBe(false);
    expect(spectator.service.pool()).toBeNull();
  });

  it('resets to the initial state', async () => {
    spectator.service.loadPoolData(5);
    await settleApi();

    spectator.service.resetStoreToInitialState();

    expect(spectator.service.pool()).toBeNull();
    expect(spectator.service.poolDisks()).toEqual([]);
  });
});
