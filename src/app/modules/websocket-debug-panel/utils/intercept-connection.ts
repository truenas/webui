import {
  asapScheduler, merge, Observable, observeOn, share, Subscription,
} from 'rxjs';
import { IncomingMessage, RequestMessage } from 'app/interfaces/api-message.interface';
import { MockGenerationError } from 'app/modules/websocket/errors';
import type { WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { DuplicateCallTrackerService } from 'app/modules/websocket-debug-panel/services/duplicate-call-tracker.service';
import { MockResponseService } from 'app/modules/websocket-debug-panel/services/mock-response.service';
import { WebSocketDebugService } from 'app/modules/websocket-debug-panel/services/websocket-debug.service';

type Connection = WebUiApiClient['connection'];
type Message = Parameters<Connection['send']>[0];
type Messages = ReturnType<Connection['messages']>;

/**
 * Puts the WebSocket debug panel between the tab and its one connection: every
 * frame written is logged, checked against the enabled mock configs and for a repeat
 * of the same request, every frame read is logged, and mocked answers are read as if
 * the appliance sent them.
 *
 * Done on the connection's own `send` and `messages()` because that is where both
 * clients meet: `ApiService`'s queue, `TypedApiService`, and the client's own
 * verbs and authenticator all write through `send` and listen on `messages()`.
 * Interception kept in any one of them would see only that one's traffic.
 *
 * Install it last, after `limitConcurrentCalls`, so a mocked call never reaches
 * the gate: it is answered here and takes no place among the calls in flight.
 *
 * One thing it cannot reach: the client's `api.job()` tracks job progress on a
 * `messages()` stream it took when it was built, before this ran. A mocked job's
 * synthetic `core.get_jobs` events reach the jobs store, whose `subscribe` takes
 * a fresh `messages()` stream, but not a typed `job()` (gap 7 in
 * docs/devs/typed-api-client.md).
 */
export function interceptConnection(
  connection: Connection,
  debug: WebSocketDebugService,
  mocks: MockResponseService,
  duplicates: DuplicateCallTrackerService,
): void {
  const send = connection.send.bind(connection);

  // Mocked answers arrive on a later tick, as a real one would. The client sends
  // a call before it listens for the answer, so one emitted inside `send` is lost.
  const messages$: Messages = merge(
    connection.messages(),
    mocks.responses$.pipe(observeOn(asapScheduler)) as Observable<unknown> as Messages,
  ).pipe(share());

  connection.messages = () => messages$;

  messages$.subscribe((message) => {
    const incoming = message as unknown as IncomingMessage;
    debug.logIncomingMessage(incoming, mocks.isMockedResponse(incoming));
  });

  connection.send = (message: Message): Subscription => {
    const request = message as unknown as RequestMessage;
    const mock = findMock(mocks, request);
    try {
      debug.logOutgoingMessage(request, Boolean(mock));
    } catch (error) {
      console.error('Error logging outgoing message:', error);
    }
    if (request.method) {
      duplicates.trackCall(request.method, request.params);
    }

    if (!mock) {
      return send(message);
    }

    try {
      mocks.generateMockResponse(request, mock);
    } catch (error) {
      throw new MockGenerationError(`Failed to generate mock response for ${request.method}`, error);
    }
    return new Subscription();
  };
}

/** A broken mock config is a reason to send the real request, not to fail it. */
function findMock(mocks: MockResponseService, request: RequestMessage): MockConfig | null {
  if (!request.id || !request.method) {
    return null;
  }
  try {
    return mocks.checkMock(request);
  } catch (error) {
    console.warn('Mock config check failed, proceeding with real request:', error);
    return null;
  }
}
