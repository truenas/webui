import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('WebSocketStatusSerice', () => {
  let spectator: SpectatorService<WebSocketStatusService>;
  let testScheduler: TestScheduler;

  const createService = createServiceFactory({
    service: WebSocketStatusService,
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  it('starts with false statuses', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isAuthenticated$).toBe('a', { a: false });
    });
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isConnected$).toBe('a', { a: false });
    });
    expect(spectator.service.isAuthenticated).toBe(false);
    expect(spectator.service.isConnected).toBe(false);
  });

  it('updates connection status', () => {
    spectator.service.setConnectionStatus(true);
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isAuthenticated$).toBe('a', { a: false });
    });
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isConnected$).toBe('a', { a: true });
    });
    expect(spectator.service.isAuthenticated).toBe(false);
    expect(spectator.service.isConnected).toBe(true);
  });

  it('updates login status and auth status also updates', () => {
    spectator.service.setConnectionStatus(true);
    spectator.service.setLoginStatus(true);

    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isAuthenticated$).toBe('a', { a: true });
    });
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isConnected$).toBe('a', { a: true });
    });
    expect(spectator.service.isAuthenticated).toBe(true);
    expect(spectator.service.isConnected).toBe(true);
  });

  it('reverses auth status when logout', () => {
    spectator.service.setConnectionStatus(true);
    spectator.service.setLoginStatus(true);

    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isAuthenticated$).toBe('a', { a: true });
    });
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isConnected$).toBe('a', { a: true });
    });
    expect(spectator.service.isAuthenticated).toBe(true);
    expect(spectator.service.isConnected).toBe(true);

    spectator.service.setLoginStatus(false);

    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isAuthenticated$).toBe('a', { a: false });
    });
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isConnected$).toBe('a', { a: true });
    });
    expect(spectator.service.isAuthenticated).toBe(false);
    expect(spectator.service.isConnected).toBe(true);
  });

  it('reverses auth status when connection closes', () => {
    spectator.service.setConnectionStatus(true);
    spectator.service.setLoginStatus(true);

    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isAuthenticated$).toBe('a', { a: true });
    });
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isConnected$).toBe('a', { a: true });
    });
    expect(spectator.service.isAuthenticated).toBe(true);
    expect(spectator.service.isConnected).toBe(true);

    spectator.service.setConnectionStatus(false);
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isAuthenticated$).toBe('a', { a: false });
    });
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isConnected$).toBe('a', { a: false });
    });
    expect(spectator.service.isAuthenticated).toBe(false);
    expect(spectator.service.isConnected).toBe(false);
  });

  it('allows reconnect when setReconnect is called with true', () => {
    spectator.service.setReconnect(true);
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isReconnectAllowed$).toBe('a', { a: true });
    });
  });

  it('disallows reconnect when setReconnect is called with false', () => {
    spectator.service.setReconnect(false);
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isReconnectAllowed$).toBe('a', { a: false });
    });
  });

  it('emits true for isActiveSession$ when both connection and login statuses are true', () => {
    testScheduler.run(({ expectObservable }) => {
      spectator.service.setConnectionStatus(true);
      spectator.service.setLoginStatus(true);

      expectObservable(spectator.service.isActiveSession$).toBe('a', { a: true });
    });
  });
});
