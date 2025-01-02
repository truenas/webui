import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { globalStore } from 'app/services/global-store/global-store.service';

const poolResponse = [
  { id: 1, name: 'pool_1' },
  { id: 2, name: 'pool_2' },
] as Pool[];

const params: QueryParams<Pool> = [
  [
    ['id', '=', 1],
    ['id', '=', 2],
  ],
];

const poolStore = globalStore('pool.query', params);

describe('GlobalStoreService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(TranslateService),
        mockProvider(ApiService, {
          call: jest.fn(() => of(poolResponse)),
          subscribe: jest.fn(() => of({
            fields: poolResponse,
          } as ApiEvent<Pool[]>)),
          callAndSubscribe: jest.fn(() => of(poolResponse)),
        }),
      ],
    });
  });

  describe('call', () => {
    it('sends a request after subscription', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.call;

      const poolSubscription = pools$.subscribe();
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledWith('pool.query', params);
      poolSubscription.unsubscribe();
    });

    it('caches a request result', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.call;
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledTimes(0);

      const poolSubscription1 = pools$.subscribe();
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledTimes(1);
      poolSubscription1.unsubscribe();

      const poolSubscription2 = pools$.subscribe();
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledTimes(1);
      poolSubscription2.unsubscribe();

      const poolSubscription3 = pools$.subscribe();
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledTimes(1);
      poolSubscription3.unsubscribe();
    });

    it('invalidates a request result', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.call;
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledTimes(0);

      const poolSubscription1 = pools$.subscribe();
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledTimes(1);
      poolSubscription1.unsubscribe();

      const poolSubscription2 = pools$.subscribe();
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledTimes(1);
      poolSubscription2.unsubscribe();

      poolStoreService.invalidate();

      const poolSubscription3 = pools$.subscribe();
      expect(TestBed.inject(ApiService).call).toHaveBeenCalledTimes(2);
      poolSubscription3.unsubscribe();
    });
  });

  describe('subscribe', () => {
    it('sends a request after subscription', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.subscribe;

      const poolSubscription = pools$.subscribe();
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledWith('pool.query');
      poolSubscription.unsubscribe();
    });

    it('caches a request result', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.subscribe;
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledTimes(0);

      const poolSubscription1 = pools$.subscribe();
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledTimes(1);
      poolSubscription1.unsubscribe();

      const poolSubscription2 = pools$.subscribe();
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledTimes(1);
      poolSubscription2.unsubscribe();

      const poolSubscription3 = pools$.subscribe();
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledTimes(1);
      poolSubscription3.unsubscribe();
    });

    it('invalidates a request result', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.subscribe;
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledTimes(0);

      const poolSubscription1 = pools$.subscribe();
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledTimes(1);
      poolSubscription1.unsubscribe();

      const poolSubscription2 = pools$.subscribe();
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledTimes(1);
      poolSubscription2.unsubscribe();

      poolStoreService.invalidate();

      const poolSubscription3 = pools$.subscribe();
      expect(TestBed.inject(ApiService).subscribe).toHaveBeenCalledTimes(2);
      poolSubscription3.unsubscribe();
    });
  });

  describe('callAndSubscribe', () => {
    it('sends a request after subscription', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.callAndSubscribe;

      const poolSubscription = pools$.subscribe();
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledWith('pool.query', params);
      poolSubscription.unsubscribe();
    });

    it('caches a request result', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.callAndSubscribe;
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledTimes(0);

      const poolSubscription1 = pools$.subscribe();
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledTimes(1);
      poolSubscription1.unsubscribe();

      const poolSubscription2 = pools$.subscribe();
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledTimes(1);
      poolSubscription2.unsubscribe();

      const poolSubscription3 = pools$.subscribe();
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledTimes(1);
      poolSubscription3.unsubscribe();
    });

    it('invalidates a request result', () => {
      const poolStoreService = TestBed.inject(poolStore);
      const pools$ = poolStoreService.callAndSubscribe;
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledTimes(0);

      const poolSubscription1 = pools$.subscribe();
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledTimes(1);
      poolSubscription1.unsubscribe();

      const poolSubscription2 = pools$.subscribe();
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledTimes(1);
      poolSubscription2.unsubscribe();

      poolStoreService.invalidate();

      const poolSubscription3 = pools$.subscribe();
      expect(TestBed.inject(ApiService).callAndSubscribe).toHaveBeenCalledTimes(2);
      poolSubscription3.unsubscribe();
    });
  });
});
