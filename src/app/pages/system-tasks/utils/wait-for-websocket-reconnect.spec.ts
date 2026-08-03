import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { waitForDisconnectTimeout, waitForWebSocketReconnect } from 'app/pages/system-tasks/utils/wait-for-websocket-reconnect';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('waitForWebSocketReconnect', () => {
  let isConnected$: BehaviorSubject<boolean>;
  let emissions: number;

  function subscribeToReconnect(): void {
    const wsStatus = { isConnected$ } as WebSocketStatusService;
    waitForWebSocketReconnect(wsStatus).subscribe(() => emissions += 1);
  }

  beforeEach(() => {
    emissions = 0;
  });

  it('waits for the connection to drop before treating a live connection as "system is back"', fakeAsync(() => {
    isConnected$ = new BehaviorSubject(true);

    subscribeToReconnect();

    expect(emissions).toBe(0);

    isConnected$.next(false);

    expect(emissions).toBe(0);

    isConnected$.next(true);

    expect(emissions).toBe(1);
  }));

  it('emits as soon as the connection is back when the socket was already down', fakeAsync(() => {
    isConnected$ = new BehaviorSubject(false);

    subscribeToReconnect();
    isConnected$.next(true);

    expect(emissions).toBe(1);
  }));

  it('does not emit again when the connection flaps after the system is back', fakeAsync(() => {
    isConnected$ = new BehaviorSubject(false);

    subscribeToReconnect();
    isConnected$.next(true);
    isConnected$.next(false);
    isConnected$.next(true);

    expect(emissions).toBe(1);
  }));

  it('stops waiting for the drop after a timeout, so a socket that never goes down is not a dead end', fakeAsync(() => {
    isConnected$ = new BehaviorSubject(true);

    subscribeToReconnect();
    tick(waitForDisconnectTimeout - 1);

    expect(emissions).toBe(0);

    tick(1);

    expect(emissions).toBe(1);
  }));

  it('keeps waiting for the connection to return after the drop timeout passes', fakeAsync(() => {
    isConnected$ = new BehaviorSubject(false);

    subscribeToReconnect();
    tick(waitForDisconnectTimeout * 2);

    expect(emissions).toBe(0);

    isConnected$.next(true);

    expect(emissions).toBe(1);
  }));
});
