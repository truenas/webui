import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { UUID } from 'angular2-uuid';
import { Subject } from 'rxjs';
import { SubscriptionManagerService } from 'app/services/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

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
    jest.spyOn(UUID, 'UUID').mockReturnValue('1');

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
    jest.spyOn(UUID, 'UUID').mockReturnValue('1');

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
    jest.spyOn(UUID, 'UUID').mockReturnValue('1');

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
    jest.spyOn(UUID, 'UUID').mockReturnValue('1');

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
    jest.spyOn(UUID, 'UUID').mockReturnValue('1');

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
});
