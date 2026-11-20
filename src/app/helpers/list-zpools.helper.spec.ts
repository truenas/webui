import { TestBed } from '@angular/core/testing';
import { CallResponse } from '@truenas/api-client';
import { firstValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { JsonRpcErrorCode } from 'app/enums/api.enum';
import { listZpools } from 'app/helpers/list-zpools.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory, ZpoolListEntry } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ApiCallError } from 'app/services/errors/error.classes';

describe('listZpools', () => {
  let api: ApiService;
  let mockApiService: MockApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockApi([
          mockCall('zpool.query', [{ name: 'tank', guid: 123 }] as CallResponse<WebUiApiDirectory, 'zpool.query'>),
        ]),
      ],
    });
    api = TestBed.inject(ApiService);
    mockApiService = TestBed.inject(MockApiService);
  });

  it('lists pools with zpool.list', async () => {
    mockApiService.mockUndeclaredCall('zpool.list', [
      { name: 'tank', guid: '10278080226199838739' },
    ] as ZpoolListEntry[]);

    const zpools = await firstValueFrom(listZpools(api, { pool_names: ['tank'] }));

    expect(zpools).toEqual([{ name: 'tank', guid: '10278080226199838739' }]);
    expect(api.callUndeclared).toHaveBeenCalledWith('zpool.list', [{ pool_names: ['tank'] }]);
    expect(api.call).not.toHaveBeenCalled();
  });

  it('falls back to zpool.query with a string guid when the appliance has no zpool.list', async () => {
    mockApiService.mockCallError('zpool.list', { code: JsonRpcErrorCode.MethodNotFound });

    const zpools = await firstValueFrom(listZpools(api, { pool_names: ['tank'] }));

    expect(zpools).toEqual([{ name: 'tank', guid: '123' }]);
    expect(api.call).toHaveBeenCalledWith('zpool.query', [{ pool_names: ['tank'] }]);
  });

  it('rethrows any other error without falling back', async () => {
    mockApiService.mockCallError('zpool.list');

    await expect(firstValueFrom(listZpools(api, {}))).rejects.toBeInstanceOf(ApiCallError);
    expect(api.call).not.toHaveBeenCalled();
  });
});
