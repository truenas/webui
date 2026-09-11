import { Injectable, inject } from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

/** Which path opened a confirmation step — cancelling a renewal is the destructive one. */
export type PendingTwoFactorKind = 'setup' | 'renewal';

const pendingKinds: PendingTwoFactorKind[] = ['setup', 'renewal'];

const keyPrefix = 'pending2FaVerification';

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
 * Being browser state, the guarantee is per browser, not per account: generate a secret
 * and open the page in another browser (or a private window, or after a storage clear)
 * and it reports the setup as settled, because `secret_configured` is all the server can
 * tell us. Closing that needs a middleware pending-secret API — until then this covers
 * the case actually reported, a crash or a navigation away.
 */
@Injectable({ providedIn: 'root' })
export class PendingTwoFactorService {
  private window = inject<Window>(WINDOW);

  /** The kind of pending confirmation for this account, or null when there is none. */
  get(username: string): PendingTwoFactorKind | null {
    const stored = this.window.localStorage.getItem(this.keyFor(username));

    return pendingKinds.find((kind) => kind === stored) ?? null;
  }

  set(username: string, kind: PendingTwoFactorKind): void {
    this.window.localStorage.setItem(this.keyFor(username), kind);
  }

  clear(username: string): void {
    this.window.localStorage.removeItem(this.keyFor(username));
  }

  private keyFor(username: string): string {
    return `${keyPrefix}:${username}`;
  }
}
