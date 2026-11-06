import { Injectable, inject } from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

/** Which path opened a confirmation step — cancelling a renewal is the destructive one. */
export type PendingTwoFactorKind = 'setup' | 'renewal';

const pendingKinds: PendingTwoFactorKind[] = ['setup', 'renewal'];

const keyPrefix = 'pending2FaVerification';

/** What is actually stored: the kind, plus when it was written. */
interface StoredPendingTwoFactor {
  kind: PendingTwoFactorKind;
  at: number;
}

/**
 * How long a marker keeps forcing the confirmation step. Nothing outside this browser can clear it,
 * so a secret confirmed on another machine would otherwise reopen the setup dialog here forever.
 * A week, because a marker still standing days later is far likelier settled elsewhere than still
 * in progress, and expiring a live one wrongly costs the guarantee this step adds.
 */
const pendingTtlMs = 7 * 24 * 60 * 60 * 1000;

/**
 * Records that an account has a 2FA secret its owner hasn't yet proven their authenticator holds.
 * Middleware arms a secret in one call with no pending state, so it lives here, persisted so a reload
 * or crash lands back on the confirmation step. Keyed by account because logout doesn't clear it.
 * Being browser state, it can't see a secret confirmed elsewhere, so it keeps asking until
 * {@link pendingTtlMs}; closing that gap needs a middleware pending-secret API.
 */
@Injectable({ providedIn: 'root' })
export class PendingTwoFactorService {
  private window = inject<Window>(WINDOW);

  /** The kind of pending confirmation for this account, or null when there is none. */
  get(username: string): PendingTwoFactorKind | null {
    const stored = this.parse(this.window.localStorage.getItem(this.keyFor(username)));

    if (!stored) {
      return null;
    }

    // Clear rather than just report it gone, so an aged-out marker does not sit there
    // being re-read and re-judged on every guard run.
    if (Date.now() - stored.at > pendingTtlMs) {
      this.clear(username);
      return null;
    }

    return stored.kind;
  }

  set(username: string, kind: PendingTwoFactorKind): void {
    const stored: StoredPendingTwoFactor = { kind, at: Date.now() };

    this.window.localStorage.setItem(this.keyFor(username), JSON.stringify(stored));
  }

  clear(username: string): void {
    this.window.localStorage.removeItem(this.keyFor(username));
  }

  private keyFor(username: string): string {
    return `${keyPrefix}:${username}`;
  }

  /**
   * Anything that is not a stamped marker this code wrote is treated as no marker at all:
   * the value is shared with whatever else can reach localStorage, and a browser whose
   * clock has moved backwards can stamp one in the future — read as fresh, which is the
   * safe direction.
   */
  private parse(raw: string | null): StoredPendingTwoFactor | null {
    if (!raw) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const { kind, at } = parsed as Partial<StoredPendingTwoFactor>;
    const storedKind = pendingKinds.find((candidate) => candidate === kind);
    if (!storedKind || typeof at !== 'number') {
      return null;
    }

    return { kind: storedKind, at };
  }
}
