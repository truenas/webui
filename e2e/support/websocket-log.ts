/**
 * A log of the app's middleware traffic, for a journey whose failure is the
 * app waiting on a call that never comes back.
 *
 * A Playwright trace records HTTP but not WebSocket frames, and the app talks
 * to middleware over one socket. This records, per socket, when it opened and
 * closed, and every JSON-RPC call's id and method, every answer's id and
 * whether it was a result or an error, and every notification's method.
 *
 * Beyond that it records only what is on an allowlist, since the log is
 * published with the run's artifacts: which collection a `core.subscribe` or
 * `core.unsubscribe` names; each event's collection, kind and id; a job
 * event's method, state and times, never its arguments; and the answers and
 * events of the failover methods below, which hold no secrets. Never a call's
 * params otherwise — they carry the password at sign-in.
 */
import type { Page, TestInfo } from '@playwright/test';

/** Failover methods whose whole answer is safe to log: states, reasons, boot ids. */
const loggedResults = new Set([
  'failover.status', 'failover.licensed', 'failover.disabled.reasons', 'failover.node', 'failover.reboot.info',
]);

/** Collections whose events are logged with their fields. */
const loggedEvents = new Set(['failover.disabled.reasons', 'failover.reboot.info']);

const maxValueLength = 400;

interface Frame {
  id?: unknown;
  method?: unknown;
  params?: unknown;
  result?: unknown;
  error?: { message?: unknown };
}

interface CollectionUpdate {
  collection?: unknown;
  msg?: unknown;
  id?: unknown;
  fields?: Record<string, unknown>;
}

function show(value: unknown): string {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > maxValueLength ? `${text.slice(0, maxValueLength)}…` : text;
}

/** The collection a `core.subscribe` names, without any arguments after a colon. */
function subscribedName(params: unknown): string {
  const name = Array.isArray(params) ? params[0] : undefined;
  return typeof name === 'string' ? name.replace(/:.*/s, '') : '?';
}

function describeEvent(method: string, params: CollectionUpdate | undefined): string {
  if (!params?.collection) {
    return `< event ${method}`;
  }
  const collection = String(params.collection);
  let line = `< event ${method} ${collection} ${String(params.msg ?? '?')}`;
  if (params.id !== undefined) {
    line += ` id=${show(params.id)}`;
  }
  const fields = params.fields;
  if (collection === 'core.get_jobs' && fields) {
    const job = {
      method: fields.method,
      state: fields.state,
      time_started: fields.time_started,
      time_finished: fields.time_finished,
    };
    line += ` ${show(job)}`;
  } else if (loggedEvents.has(collection) && fields) {
    line += ` ${show(fields)}`;
  }
  return line;
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
    // Per socket: an answer carries only the id of the call it answers.
    const pending = new Map<string, string>();

    const describe = (direction: '>' | '<', payload: string | Buffer): string => {
      let message: Frame;
      try {
        message = JSON.parse(String(payload)) as Frame;
      } catch {
        return `${direction} (not JSON, ${payload.length} bytes)`;
      }
      const id = message.id === undefined || message.id === null ? undefined : String(message.id);
      if (direction === '>') {
        const method = String(message.method ?? '?');
        if (id) {
          pending.set(id, method);
        }
        const about = method === 'core.subscribe' || method === 'core.unsubscribe'
          ? ` ${subscribedName(message.params)}`
          : '';
        return `> ${id ?? '-'} ${method}${about}`;
      }
      if (id) {
        const method = pending.get(id);
        pending.delete(id);
        if (message.error) {
          return `< ${id} error: ${String(message.error.message ?? '').slice(0, 200)}`;
        }
        return method && loggedResults.has(method)
          ? `< ${id} result ${method} ${show(message.result)}`
          : `< ${id} result`;
      }
      return describeEvent(String(message.method ?? '?'), message.params as CollectionUpdate | undefined);
    };

    lines.push(`${stamp()} ${name} open ${socket.url()}`);
    socket.on('framesent', (frame) => lines.push(`${stamp()} ${name} ${describe('>', frame.payload)}`));
    socket.on('framereceived', (frame) => lines.push(`${stamp()} ${name} ${describe('<', frame.payload)}`));
    socket.on('socketerror', (error) => lines.push(`${stamp()} ${name} error ${error}`));
    socket.on('close', () => lines.push(`${stamp()} ${name} close`));
  });

  return async () => {
    await testInfo.attach('websocket-calls', { body: lines.join('\n'), contentType: 'text/plain' });
  };
}
