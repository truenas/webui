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
 * How long a marker keeps forcing the confirmation step.
 *
 * Nothing outside this browser can clear it: confirm the same secret on another machine
 * and this one goes on re-opening the `disableClose` setup dialog on every guard run,
 * because `secret_configured` reads the same either way. Bounding it is what turns that
 * from indefinite into a nuisance that ages out.
 *
 * A week, because the two cases are far apart in scale — a confirmation step is a minute's
 * work and a reload lands straight back on it, so a marker still standing days later is
 * much more likely a secret settled elsewhere than a setup still in progress. Expiring one
 * wrongly costs the guarantee this whole step adds, so the bound is deliberately generous.
 */
const pendingTtlMs = 7 * 24 * 60 * 60 * 1000;

/**
 * Records that an account has a 2FA secret its owner has not yet proven their
 * authenticator app holds.
 *
 * The middleware mints and arms a secret in one call and has no notion of a secret
 * awaiting confirmation, so that state lives here. It is persisted rather than kept in
 * memory so a reload, a navigation away, or a browser crash lands the user back on the
 * confirmation step instead of on a page claiming the setup is finished — and it is read
 * by the guard that opens the first-login dialog as well as by the setup page, so a
 * reload mid-setup does not walk past the prompt.
 *
 * Keyed by account because nothing clears it on logout: on a shared workstation an
 * origin-wide key would put the next user into a confirmation step for a secret that was
 * never theirs.
 *
 * Being browser state, the guarantee is per browser, not per account, and it is one-way
 * in both directions. Generate a secret here and open the page in another browser (or a
 * private window, or after a storage clear) and it reports the setup as settled, because
 * `secret_configured` is all the server can tell us. Confirm it over there instead and
 * nothing tells this browser, which goes on asking for a code against a secret that is
 * already settled — escapable by entering the code, and bounded by {@link pendingTtlMs}
 * so it is not indefinite. Closing either needs a middleware pending-secret API.
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
