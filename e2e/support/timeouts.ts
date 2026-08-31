/**
 * How long a single middleware *call* may take.
 *
 * Only the two call budgets live here. Per-operation waits — how long a job may
 * run, how long a service may take to start — stay at their call sites, where
 * the number means something about that operation rather than about the API.
 */

/** A filtered query. Fast, or something is wrong. */
export const readTimeoutMs = 30_000;

/**
 * A call that does work on the appliance rather than reading from it.
 *
 * `disk.details` walks the whole inventory, `sharing.smb.delete` reloads the
 * SMB service, and `user.delete` can be slow on a busy appliance. None of them
 * reliably answers inside the read budget.
 */
export const slowCallTimeoutMs = 60_000;
