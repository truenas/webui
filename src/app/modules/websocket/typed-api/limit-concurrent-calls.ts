import { Subscription } from 'rxjs';
import type { WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';

type Connection = WebUiApiClient['connection'];
type Message = Parameters<Connection['send']>[0];

/**
 * How many calls middleware will hold for one connection: it runs ten and lets
 * ten more wait. The next is refused with "Maximum number of concurrent calls
 * (20) has exceeded".
 */
export const maxConcurrentCalls = 20;

/**
 * How many of those the tab's own requests may take. One is left for the
 * client's keepalive `core.ping`, which is written straight to the socket every
 * 20 s and so cannot be held back here, but which middleware counts all the same.
 */
export const maxGatedCalls = maxConcurrentCalls - 1;

interface WaitingCall {
  id: string;
  message: Message;
  handle: Subscription;
}

/**
 * Holds requests back so that no more than `limit` are awaiting an answer on
 * `connection` at once. The rest wait their turn, in the order they were sent.
 *
 * Done on the connection's own `send` because that is where requests meet:
 * `ApiService`'s queue, `TypedApiService`, and the client's own verbs and
 * authenticator all write through it. A limit kept by any one of them counts
 * only its own calls, and the tab's total is what middleware refuses.
 *
 * Only requests count: a frame with both an `id` and a `method`. A request is
 * finished when a frame with its id comes back, whether or not its caller is
 * still listening, since the appliance is busy with it either way.
 */
export function limitConcurrentCalls(connection: Connection, limit = maxGatedCalls): void {
  const send = connection.send.bind(connection);
  /**
   * Each call awaiting an answer, with the handle the connection gave for it.
   * That handle closes once the frame is written: until then the connection is
   * still holding the frame for a socket, and giving up on it takes it back.
   */
  const inFlight = new Map<string, Subscription>();
  const waiting: WaitingCall[] = [];
  let wasOpen = false;

  // The three below call each other in a ring, hence declarations: they hoist.
  function start({ id, message, handle }: WaitingCall): void {
    // Counted before it is sent, in case the answer arrives as it is written.
    inFlight.set(id, Subscription.EMPTY);
    const sending = send(message);
    if (!inFlight.has(id)) {
      return;
    }
    inFlight.set(id, sending);

    handle.add(() => {
      const isWritten = sending.closed;
      sending.unsubscribe();
      // Given up on before a socket took it: it was never written, and no
      // answer is coming to free its place.
      if (!isWritten && inFlight.get(id) === sending) {
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

  connection.opened$.subscribe((isOpen) => {
    const isLost = wasOpen && !isOpen;
    wasOpen = isOpen;
    if (!isLost) {
      return;
    }

    // What was written on the socket is lost with it, answers included, and what
    // was waiting here goes the same way. A frame the connection has not written
    // yet is still its to send on the next socket, so that one stays counted.
    inFlight.forEach((sending, id) => {
      if (sending.closed) {
        inFlight.delete(id);
      }
    });
    waiting.length = 0;
  });

  connection.messages().subscribe((message) => {
    if (message.id !== undefined && message.id !== null) {
      finish(String(message.id));
    }
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
