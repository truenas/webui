import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { NetworkService } from 'app/services/network.service';

describe('NetworkService', () => {
  let spectator: SpectatorService<NetworkService>;
  let scheduler: TestScheduler;
  const licensed$ = new BehaviorSubject(false);
  const status$ = new BehaviorSubject(FailoverStatus.Single);
  const config$ = new BehaviorSubject<FailoverConfig>({
    disabled: true,
    id: 1,
    master: false,
    timeout: 3,
  });

  const createService = createServiceFactory({
    service: NetworkService,
    providers: [
      mockProvider(ApiService, {
        call: jest.fn((method) => {
          if (method === 'failover.licensed') {
            return licensed$;
          }

          if (method === 'failover.status') {
            return status$;
          }

          if (method === 'failover.config') {
            return config$;
          }
          return of();
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    scheduler = getTestScheduler();
  });

  describe('getIsHaEnabled', () => {
    it('returns false when not licensed', () => {
      licensed$.next(false);
      status$.next(FailoverStatus.Master);
      config$.next({
        disabled: false, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: false,
        });
      });
    });

    it('returns false when status is Single', () => {
      licensed$.next(true);
      status$.next(FailoverStatus.Single);
      config$.next({
        disabled: false, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: false,
        });
      });
    });

    it('returns false when config is disabled', () => {
      licensed$.next(true);
      status$.next(FailoverStatus.Master);
      config$.next({
        disabled: true, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: false,
        });
      });
    });

    it('returns false when not licensed and status is Single', () => {
      licensed$.next(false);
      status$.next(FailoverStatus.Single);
      config$.next({
        disabled: false, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: false,
        });
      });
    });

    it('returns false when not licensed and config is disabled', () => {
      licensed$.next(false);
      status$.next(FailoverStatus.Master);
      config$.next({
        disabled: true, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: false,
        });
      });
    });

    it('returns false when status is Single and config is disabled', () => {
      licensed$.next(true);
      status$.next(FailoverStatus.Single);
      config$.next({
        disabled: true, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: false,
        });
      });
    });

    it('returns false when all conditions fail', () => {
      licensed$.next(false);
      status$.next(FailoverStatus.Single);
      config$.next({
        disabled: true, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: false,
        });
      });
    });

    it('returns true when licensed with Master status and config enabled', () => {
      licensed$.next(true);
      status$.next(FailoverStatus.Master);
      config$.next({
        disabled: false, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: true,
        });
      });
    });

    it('returns true when licensed with Backup status and config enabled', () => {
      licensed$.next(true);
      status$.next(FailoverStatus.Backup);
      config$.next({
        disabled: false, id: 1, master: false, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: true,
        });
      });
    });

    it('returns true when licensed with Electing status and config enabled', () => {
      licensed$.next(true);
      status$.next(FailoverStatus.Electing);
      config$.next({
        disabled: false, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: true,
        });
      });
    });

    it('returns true when licensed with Importing status and config enabled', () => {
      licensed$.next(true);
      status$.next(FailoverStatus.Importing);
      config$.next({
        disabled: false, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: true,
        });
      });
    });

    it('returns true when licensed with Error status and config enabled', () => {
      licensed$.next(true);
      status$.next(FailoverStatus.Error);
      config$.next({
        disabled: false, id: 1, master: true, timeout: 3,
      } as FailoverConfig);

      scheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getIsHaEnabled()).toBe('a', {
          a: true,
        });
      });
    });
  });
});
