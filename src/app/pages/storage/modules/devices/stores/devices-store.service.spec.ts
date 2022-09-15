import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { DevicesState, DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { WebSocketService } from 'app/services';

describe('DevicesStore', () => {
  let spectator: SpectatorService<DevicesStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: DevicesStore,
    providers: [
      mockProvider(WebSocketService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('loads pool topology, disks and sets loading indicators when loadNodes is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockWebsocket = spectator.inject(WebSocketService);
      jest.spyOn(mockWebsocket, 'call').mockImplementation((method) => {
        if (method === 'pool.query') {
          return cold('-b|', {
            b: [{
              name: 'tank',
              topology: {
                data: [
                  { name: 'raidz1-0', guid: 'guid1' },
                ],
                cache: [
                  { name: 'sdr', guid: 'guid2' },
                ],
                log: [],
                spare: [],
                special: [],
                dedup: [],
              },
            } as Pool],
          });
        }

        if (method === 'disk.query') {
          return cold('-b|', { b: [{ devname: 'sdr' }] as Disk[] });
        }
      });

      spectator.service.loadNodes(4);
      expectObservable(spectator.service.state$).toBe('a-b', {
        a: {
          isLoading: true,
          error: null,
          nodes: [],
          diskDictionary: {},
          poolId: 4,
          selectedNodeGuid: null,
        },
        b: {
          isLoading: false,
          error: null,
          nodes: [
            {
              children: [
                { name: 'raidz1-0', guid: 'guid1' },
              ],
              group: 'Data VDEVs',
              guid: 'data',
            },
            {
              children: [
                { name: 'sdr', guid: 'guid2' },
              ],
              group: 'Cache',
              guid: 'cache',
            },
          ],
          diskDictionary: {
            sdr: { devname: 'sdr' },
          },
          poolId: 4,
          selectedNodeGuid: null,
        },
      });
    });
  });

  describe('selectNodeByGuid', () => {
    it('updates selectNodeByGuid in state', () => {
      testScheduler.run(({ expectObservable }) => {
        spectator.service.selectNodeByGuid('guid2');
        expectObservable(spectator.service.state$).toBe('a', {
          a: expect.objectContaining({
            selectedNodeGuid: 'guid2',
          }),
        });
      });
    });
  });

  describe('selectedBranch$', () => {
    it('returns an array of nodes going from parent to child matching selected guid', async () => {
      spectator.service.patchState({
        nodes: [
          {
            children: [
              { name: 'raidz1-0', guid: 'guid1' },
            ],
            group: 'Data VDEVs',
            guid: 'data',
          },
        ],
        selectedNodeGuid: 'guid1',
      } as DevicesState);

      const selectedBranch = await firstValueFrom(spectator.service.selectedBranch$);
      expect(selectedBranch).toEqual([
        expect.objectContaining({ guid: 'data' }),
        expect.objectContaining({ guid: 'guid1' }),
      ]);
    });
  });
});
