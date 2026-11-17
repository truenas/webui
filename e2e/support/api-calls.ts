/**
 * What the page asked middleware, read off the page's own websocket: the only evidence that a control sent
 * a request when the answer didn't change what's on screen. Opt in with `test.use({ recordApiCalls: true })`;
 * the `page` fixture starts recording because the socket opens during its sign-in, before any test body runs.
 */
import type { Page } from '@playwright/test';

/** One JSON-RPC call the page made, and how middleware has answered it so far. */
export interface RecordedApiCall {
  method: string;
  /** `undefined` until the answer arrives. */
  answer: 'result' | 'error' | undefined;
}

/** The fields of a JSON-RPC frame this reads. Anything else in it is ignored. */
interface JsonRpcFrame {
  id?: unknown;
  method?: unknown;
  error?: unknown;
}

const recordings = new WeakMap<Page, Map<string, RecordedApiCall>>();

function parseFrame(payload: string | Buffer): JsonRpcFrame | undefined {
  if (typeof payload !== 'string') {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(payload);
    return typeof parsed === 'object' && parsed !== null ? parsed as JsonRpcFrame : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Records every call the page sends over any websocket it opens from now on,
 * paired with its answer by JSON-RPC id. A frame that is not JSON-RPC is skipped.
 */
export function recordApiCalls(page: Page): void {
  const calls = new Map<string, RecordedApiCall>();
  recordings.set(page, calls);

  page.on('websocket', (socket) => {
    socket.on('framesent', ({ payload }) => {
      const frame = parseFrame(payload);
      if (frame?.id !== undefined && typeof frame.method === 'string') {
        calls.set(String(frame.id), { method: frame.method, answer: undefined });
      }
    });

    socket.on('framereceived', ({ payload }) => {
      const frame = parseFrame(payload);
      const call = frame?.id === undefined ? undefined : calls.get(String(frame.id));
      if (frame && call) {
        call.answer = 'error' in frame ? 'error' : 'result';
      }
    });
  });
}

/**
 * The calls to one method the page has made so far, oldest first, as they
 * stand now — poll it rather than reading it once.
 */
export function apiCallsTo(page: Page, method: string): RecordedApiCall[] {
  const calls = recordings.get(page);
  if (!calls) {
    throw new Error(
      'This page is not recording its API calls. Add `test.use({ recordApiCalls: true })` to the spec.',
    );
  }

  return [...calls.values()]
    .filter((call) => call.method === method)
    .map((call) => ({ ...call }));
}
