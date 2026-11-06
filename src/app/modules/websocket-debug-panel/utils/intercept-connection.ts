import {
  asapScheduler, merge, Observable, observeOn, share, Subscription,
} from 'rxjs';
import { IncomingMessage, RequestMessage } from 'app/interfaces/api-message.interface';
import { MockGenerationError } from 'app/modules/websocket/errors';
import type { WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { MockResponseService } from 'app/modules/websocket-debug-panel/services/mock-response.service';
import { WebSocketDebugService } from 'app/modules/websocket-debug-panel/services/websocket-debug.service';

type Connection = WebUiApiClient['connection'];
type Message = Parameters<Connection['send']>[0];
type Messages = ReturnType<Connection['messages']>;

/**
 * Puts the debug panel between the tab and its connection: frames are logged both ways, writes are
 * checked against the enabled mocks, and mocked answers are read as if the appliance sent them.
 * It wraps the connection's `send` and `messages()` because all traffic meets there. Install it after
 * `limitConcurrentCalls`, so a mocked call is answered here and never takes a slot at the gate.
 */
export function interceptConnection(
  connection: Connection,
  debug: WebSocketDebugService,
  mocks: MockResponseService,
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
