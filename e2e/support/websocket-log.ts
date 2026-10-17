/**
 * A log of the app's middleware traffic, for a journey whose failure is the
 * app waiting on a call that never comes back.
 *
 * A Playwright trace records HTTP but not WebSocket frames, and the app talks
 * to middleware over one socket. This records, per socket, when it opened and
 * closed, and every JSON-RPC call's id and method, every answer's id and
 * whether it was a result or an error, and every notification's method —
 * never a call's params, which carry the password at sign-in.
 */
import type { Page, TestInfo } from '@playwright/test';

function describeFrame(direction: '>' | '<', payload: string | Buffer): string {
  let message: { id?: unknown; method?: unknown; error?: { message?: unknown }; params?: unknown };
  try {
    message = JSON.parse(String(payload)) as typeof message;
  } catch {
    return `${direction} (not JSON, ${payload.length} bytes)`;
  }
  if (direction === '>') {
    return `> ${String(message.id ?? '-')} ${String(message.method ?? '?')}`;
  }
  if (message.id !== undefined && message.id !== null) {
    return message.error
      ? `< ${String(message.id)} error: ${String(message.error.message ?? '').slice(0, 200)}`
      : `< ${String(message.id)} result`;
  }
  const collection = (message.params as { collection?: unknown } | undefined)?.collection;
  const about = collection ? ' ' + String(collection) : '';
  return `< event ${String(message.method ?? '?')}${about}`;
}

/**
 * Starts recording `page`'s sockets from now on. The returned function
 * attaches what was recorded to the test, and is meant for a `finally`.
 */
export function recordWebSockets(page: Page, testInfo: TestInfo): () => Promise<void> {
  const started = Date.now();
  const lines: string[] = [];
  const stamp = (): string => `${((Date.now() - started) / 1000).toFixed(1)}s`;
  let sockets = 0;

  page.on('websocket', (socket) => {
    sockets += 1;
    const name = `#${sockets}`;
    lines.push(`${stamp()} ${name} open ${socket.url()}`);
    socket.on('framesent', (frame) => lines.push(`${stamp()} ${name} ${describeFrame('>', frame.payload)}`));
    socket.on('framereceived', (frame) => lines.push(`${stamp()} ${name} ${describeFrame('<', frame.payload)}`));
    socket.on('socketerror', (error) => lines.push(`${stamp()} ${name} error ${error}`));
    socket.on('close', () => lines.push(`${stamp()} ${name} close`));
  });

  return async () => {
    await testInfo.attach('websocket-calls', { body: lines.join('\n'), contentType: 'text/plain' });
  };
}
