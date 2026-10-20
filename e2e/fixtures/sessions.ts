/**
 * Sessions middleware holds, read over the API with `auth.sessions`.
 *
 * Read the way the Access card reads them, `internal` ones left out, and
 * reduced to what a spec needs to find a session's row and check it again
 * afterwards: its `id`, the username the card shows, and its `origin`.
 *
 * `current` is true only for the session of the client that asked. Asked
 * through the worker `api`, that is the worker client's own session, not the
 * browser's.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/**
 * The part of a session's credentials this reads. `credentials_data` is declared
 * as one model per credential type, so it is narrowed to these fields.
 */
interface SessionCredentials {
  credentials: string;
  credentials_data?: {
    username?: string;
    parent?: SessionCredentials;
  };
}

interface SessionRow extends SessionCredentials {
  id: string;
  current: boolean;
  origin: string;
}

export interface Session {
  id: string;
  /** The username the card shows: the session's own, or for a token session its parent's. */
  username: string;
  /** Per connection, e.g. `<address>:<port>`. Part of the row's ids. */
  origin: string;
  /** `LOGIN_PASSWORD`, `TOKEN`, `API_KEY`, … */
  credentials: string;
  current: boolean;
}

/** The card's `getUsername`: a token session belongs to whoever minted the token. */
function sessionUsername(session: SessionCredentials | undefined): string {
  if (!session?.credentials_data) {
    return '';
  }
  return session.credentials_data.username || sessionUsername(session.credentials_data.parent);
}

/** Every session the Access card lists. */
export async function readSessions(client: E2eApiClient): Promise<Session[]> {
  const rows = await firstValueFrom(
    client.api.query('auth.sessions', [['internal', '=', false]]).pipe(timeout(readTimeoutMs)),
  ) as unknown as SessionRow[];

  return rows.map((row) => ({
    id: row.id,
    username: sessionUsername(row),
    origin: row.origin,
    credentials: row.credentials,
    current: row.current,
  }));
}

/** The sessions the card shows as belonging to `username`. */
export async function readUserSessions(client: E2eApiClient, username: string): Promise<Session[]> {
  return (await readSessions(client)).filter((session) => session.username === username);
}

/** Whether middleware still holds the session with this `id`. */
export async function isSessionPresent(client: E2eApiClient, id: string): Promise<boolean> {
  return (await readSessions(client)).some((session) => session.id === id);
}
