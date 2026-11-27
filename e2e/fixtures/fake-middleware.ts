/**
 * Fakes chosen middleware answers in the page, for a journey that needs hardware or a licence the appliance
 * lacks: SED disks, an enclosure, an entitlement. Every call still goes to the real appliance; an override
 * only rewrites the answer the page receives, and every other method and every event pass through unchanged.
 *
 * Opt in with `test.use({ middlewareOverrides: { … } })`. The `page` fixture routes the socket before its
 * sign-in, because the app opens it there and asks for some of what is faked (`truenas.entitlements.info`)
 * straight away. See "Faking middleware" in `e2e/CLAUDE.md` for what such a test can and cannot claim.
 */
import type { Page, WebSocketRoute } from '@playwright/test';
import type { CallMethod, CallParams, CallResponse } from '@truenas/api-client';
import type { E2eApiDirectory } from '../support/api/client';

type Method = CallMethod<E2eApiDirectory>;

/**
 * Rewrites one method's successful answer. It is given what the appliance answered and the call's params,
 * and returns what the page receives instead. A call the appliance refuses reaches the page refused.
 */
export type AnswerOverride<M extends Method> = (
  answer: CallResponse<E2eApiDirectory, M>,
  params: CallParams<E2eApiDirectory, M>,
) => CallResponse<E2eApiDirectory, M>;

/** The overrides for one test, by method. */
export type MiddlewareOverrides = { [M in Method]?: AnswerOverride<M> };

type AnyOverride = (answer: unknown, params: unknown) => unknown;

/** The fields of a JSON-RPC frame this reads. Anything else in it is kept as it was. */
interface JsonRpcFrame {
  id?: unknown;
  method?: unknown;
  params?: unknown;
  result?: unknown;
}

/** The app's middleware socket. The shell and other sockets are not routed. */
const apiSocket = /\/api\/current(?:\?.*)?$/;

function parseFrame(message: string | Buffer): JsonRpcFrame | undefined {
  if (typeof message !== 'string') {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(message);
    return typeof parsed === 'object' && parsed !== null ? parsed as JsonRpcFrame : undefined;
  } catch {
    return undefined;
  }
}

function overrideFor(overrides: MiddlewareOverrides, method: unknown): AnyOverride | undefined {
  return typeof method === 'string'
    ? (overrides as Partial<Record<string, AnyOverride>>)[method]
    : undefined;
}

/** Relays one page socket to the appliance, rewriting the answers to the calls an override covers. */
function relay(page: WebSocketRoute, overrides: MiddlewareOverrides): void {
  const server = page.connectToServer();
  // By JSON-RPC id: an answer names only the call it answers.
  const pending = new Map<string, { override: AnyOverride; params: unknown }>();

  page.onMessage((message) => {
    const frame = parseFrame(message);
    const override = overrideFor(overrides, frame?.method);
    if (frame?.id !== undefined && override) {
      pending.set(String(frame.id), { override, params: frame.params });
    }
    server.send(message);
  });

  server.onMessage((message) => {
    const frame = parseFrame(message);
    const id = frame?.id === undefined ? undefined : String(frame.id);
    const call = id === undefined ? undefined : pending.get(id);
    if (!frame || !id || !call) {
      page.send(message);
      return;
    }

    pending.delete(id);
    page.send('result' in frame
      ? JSON.stringify({ ...frame, result: call.override(frame.result, call.params) })
      : message);
  });
}

/**
 * Routes `page`'s middleware socket through `overrides`. Call it before the page opens the socket: a socket
 * already open is not routed.
 */
export async function fakeMiddleware(page: Page, overrides: MiddlewareOverrides): Promise<void> {
  await page.routeWebSocket(apiSocket, (socket) => relay(socket, overrides));
}
