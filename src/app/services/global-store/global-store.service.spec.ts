import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { TypedQueryFilter, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { globalStore } from 'app/services/global-store/global-store.service';

type Pool = WebUiQueryEntity<'pool.query'>;

const poolResponse = [
  { id: 1, name: 'pool_1' },
  { id: 2, name: 'pool_2' },
] as Pool[];

const filters: TypedQueryFilter<Pool>[] = [
  ['id', '=', 1],
  ['id', '=', 2],
];

const poolStore = globalStore('pool.query', filters);

describe('GlobalStoreService', () => {
  let api: TypedApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Answered synchronously, so each subscription below sees the cache the previous one left.
        mockProvider(TypedApiService, {
          query: jest.fn(() => of(poolResponse)),
        }),
      ],
    });
    api = TestBed.inject(TypedApiService);
  });

  it('sends the query after subscription', () => {
    const pools$ = TestBed.inject(poolStore).call;

    const poolSubscription = pools$.subscribe();
    expect(api.query).toHaveBeenCalledWith('pool.query', filters);
    poolSubscription.unsubscribe();
  });

  it('caches the query result', () => {
    const pools$ = TestBed.inject(poolStore).call;
    expect(api.query).toHaveBeenCalledTimes(0);

    const poolSubscription1 = pools$.subscribe();
    expect(api.query).toHaveBeenCalledTimes(1);
    poolSubscription1.unsubscribe();

    const poolSubscription2 = pools$.subscribe();
    expect(api.query).toHaveBeenCalledTimes(1);
    poolSubscription2.unsubscribe();

    const poolSubscription3 = pools$.subscribe();
    expect(api.query).toHaveBeenCalledTimes(1);
    poolSubscription3.unsubscribe();
  });

  it('invalidates the query result', () => {
    const poolStoreService = TestBed.inject(poolStore);
    const pools$ = poolStoreService.call;
    expect(api.query).toHaveBeenCalledTimes(0);

    const poolSubscription1 = pools$.subscribe();
    expect(api.query).toHaveBeenCalledTimes(1);
    poolSubscription1.unsubscribe();

    const poolSubscription2 = pools$.subscribe();
    expect(api.query).toHaveBeenCalledTimes(1);
    poolSubscription2.unsubscribe();

    poolStoreService.invalidate();

    const poolSubscription3 = pools$.subscribe();
    expect(api.query).toHaveBeenCalledTimes(2);
    poolSubscription3.unsubscribe();
  });
});
