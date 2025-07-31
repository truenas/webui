import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import {
  of, Subject,
} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ApiErrorName } from 'app/enums/api.enum';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { SubscriptionManagerService } from 'app/modules/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('SubscriptionManagerService', () => {
  let spectator: SpectatorService<SubscriptionManagerService>;
  let wsHandler: WebSocketHandlerService;
  const responses$ = new Subject();

  const createService = createServiceFactory({
    service: SubscriptionManagerService,
    providers: [
      mockProvider(WebSocketHandlerService, {
        responses$,
        scheduleCall: jest.fn(),
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$: of(true),
        isAuthenticated$: of(true),
        isConnected: true,
        isAuthenticated: true,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    wsHandler = spectator.inject(WebSocketHandlerService);
  });

  it('sends a core.subscribe message when new subscription is initiated', () => {
    spectator.service.subscribe('disk.query').subscribe();

    expect(wsHandler.scheduleCall).toHaveBeenCalledWith({
      id: expect.any(String),
      method: 'core.subscribe',
      params: ['disk.query'],
    });
  });

  it('returns relevant websocket messages that are part of the subscribed collection after connection has been established', () => {
    jest.spyOn({ v4: uuidv4 }, 'v4').mockReturnValue('1');

    const messages: unknown[] = [];
    spectator.service.subscribe('disk.query').subscribe((message) => messages.push(message));

    responses$.next({
      jsonrpc: '2.0',
      id: '1',
      result: 1,
    });
    responses$.next({
      jsonrpc: '2.0',
      method: 'collection_update',
      params: {
        collection: 'disk.query',
        data: 'data',
      },
    });
    responses$.next({
      jsonrpc: '2.0',
      method: 'collection_update',
      params: {
        collection: 'unrelated.collection',
      },
    });

    expect(messages).toHaveLength(1);
    expect(messages).toEqual([{ collection: 'disk.query', data: 'data' }]);
  });

  it('does not establish new websocket connections if one connection is already open', () => {
    jest.spyOn({ v4: uuidv4 }, 'v4').mockReturnValue('1');

    const messages1: unknown[] = [];
    spectator.service.subscribe('disk.query').subscribe((message) => messages1.push(message));

    responses$.next({
      jsonrpc: '2.0',
      id: '1',
      result: 'backend-subscription-id',
    });

    const messages2: unknown[] = [];
    spectator.service.subscribe('disk.query').subscribe((message) => messages2.push(message));

    responses$.next({
      jsonrpc: '2.0',
      method: 'collection_update',
      params: {
        collection: 'disk.query',
        data: 'data',
      },
    });

    expect(messages1).toEqual([{ collection: 'disk.query', data: 'data' }]);
    expect(messages2).toEqual([{ collection: 'disk.query', data: 'data' }]);

    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(1);
  });

  it('sends unsubscribe message when all consumers unsubscribe', () => {
    jest.spyOn({ v4: uuidv4 }, 'v4').mockReturnValue('1');

    const subscription1 = spectator.service.subscribe('disk.query').subscribe();
    const subscription2 = spectator.service.subscribe('disk.query').subscribe();

    responses$.next({
      jsonrpc: '2.0',
      id: '1',
      result: 'backend-subscription-id',
    });

    subscription1.unsubscribe();

    expect(wsHandler.scheduleCall).not.toHaveBeenCalledWith(expect.objectContaining({
      method: 'core.unsubscribe',
    }));

    subscription2.unsubscribe();

    expect(wsHandler.scheduleCall).toHaveBeenCalledWith({
      id: expect.any(String),
      method: 'core.unsubscribe',
      params: ['backend-subscription-id'],
    });
  });

  it(`waits for subscription to be established before unsubscribing
    if consumer unsubscribes before backend subscription has been established`, () => {
    jest.spyOn({ v4: uuidv4 }, 'v4').mockReturnValue('1');

    const subscription = spectator.service.subscribe('disk.query').subscribe();

    subscription.unsubscribe();

    expect(wsHandler.scheduleCall).not.toHaveBeenCalledWith(expect.objectContaining({
      method: 'core.unsubscribe',
    }));

    responses$.next({
      jsonrpc: '2.0',
      id: '1',
      result: 'backend-subscription-id',
    });

    expect(wsHandler.scheduleCall).toHaveBeenLastCalledWith({
      id: expect.any(String),
      method: 'core.unsubscribe',
      params: ['backend-subscription-id'],
    });
  });

  it(`does not send unsubscribe message if new consumer subscribed to an endpoint after all other consumers
    unsubscribed, but before backend subscription has a chance to be closed`, () => {
    jest.spyOn({ v4: uuidv4 }, 'v4').mockReturnValue('1');

    const subscription1 = spectator.service.subscribe('disk.query').subscribe();
    subscription1.unsubscribe();
    // Unsubscribe message scheduled here.

    spectator.service.subscribe('disk.query').subscribe();

    responses$.next({
      jsonrpc: '2.0',
      id: '1',
      result: 'backend-subscription-id',
    });

    expect(wsHandler.scheduleCall).not.toHaveBeenCalledWith(expect.objectContaining({
      method: 'core.unsubscribe',
    }));
  });

  // eslint-disable-next-line jest/no-done-callback
  it('should throw ApiCallError when receiving notify_unsubscribed with error', (done) => {
    jest.spyOn({ v4: uuidv4 }, 'v4').mockReturnValue('1');

    spectator.service.subscribe('virt.instance.metrics').subscribe({
      next: () => {},
      error: (error: unknown) => {
        expect(error).toMatchObject({
          message: 'Invalid subscription',
          error: {
            data: {
              error: 22,
              errname: ApiErrorName.Validation,
              reason: 'Invalid subscription',
            },
          },
        });
        done();
      },
      complete: () => {
        done.fail('Observable completed when it should have errored');
      },
    });

    responses$.next({
      jsonrpc: '2.0',
      id: '1',
      result: 'backend-subscription-id',
    });

    responses$.next({
      jsonrpc: '2.0',
      method: 'notify_unsubscribed',
      params: {
        collection: 'virt.instance.metrics',
        error: {
          error: 22,
          errname: ApiErrorName.Validation,
          reason: 'Invalid subscription',
        } as ApiErrorDetails,
      },
    });
  });
});
