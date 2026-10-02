import { Subscription } from 'rxjs';
import type { WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';

type Connection = WebUiApiClient['connection'];
type Message = Parameters<Connection['send']>[0];

/**
 * How many calls middleware runs at once for one connection. It refuses the next
 * one with "Maximum number of concurrent calls (20) has exceeded".
 */
export const maxConcurrentCalls = 20;

interface WaitingCall {
  id: string;
  message: Message;
  handle: Subscription;
}

/**
 * Holds requests back so that no more than `limit` are awaiting an answer on
 * `connection` at once. The rest wait their turn, in the order they were sent.
 *
 * Done on the connection's own `send` because that is the one place every
 * request passes: `ApiService`'s queue, `TypedApiService`, and the client's own
 * verbs and authenticator all write through it. A limit kept by any one of them
 * counts only its own calls, and the tab's total is what middleware refuses.
 *
 * Only requests count: a frame with both an `id` and a `method`. A request is
 * finished when a frame with its id comes back, whether or not its caller is
 * still listening, since the appliance is busy with it either way.
 */
export function limitConcurrentCalls(connection: Connection, limit = maxConcurrentCalls): void {
  const send = connection.send.bind(connection);
  const inFlight = new Set<string>();
  const waiting: WaitingCall[] = [];
  let isOpen = false;

  // The three below call each other in a ring, hence declarations: they hoist.
  function start({ id, message, handle }: WaitingCall): void {
    inFlight.add(id);
    const sending = send(message);
    handle.add(() => {
      sending.unsubscribe();
      // Given up on before a socket took it, so it was never written and no
      // answer is coming to free its place.
      if (!isOpen) {
        finish(id);
      }
    });
  }

  function startWaiting(): void {
    while (inFlight.size < limit) {
      const next = waiting.shift();
      if (!next) {
        return;
      }
      start(next);
    }
  }

  function finish(id: string): void {
    if (inFlight.delete(id)) {
      startWaiting();
    }
  }

  connection.opened$.subscribe((opened) => {
    isOpen = opened;
  });

  connection.messages().subscribe((message) => {
    if (message.id !== undefined && message.id !== null) {
      finish(String(message.id));
    }
  });

  // What was sent on a socket is lost with it, answers included, and the
  // connection drops what it had queued. The calls still waiting here go too.
  connection.closed$.subscribe(() => {
    inFlight.clear();
    waiting.length = 0;
  });

  connection.send = (message: Message): Subscription => {
    if (message.id === undefined || message.id === null || !message.method) {
      return send(message);
    }

    const call: WaitingCall = { id: String(message.id), message, handle: new Subscription() };
    if (inFlight.size < limit) {
      start(call);
      return call.handle;
    }

    waiting.push(call);
    call.handle.add(() => {
      const index = waiting.indexOf(call);
      if (index >= 0) {
        waiting.splice(index, 1);
      }
    });
    return call.handle;
  };
}
