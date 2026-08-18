/**
 * The two API budgets the suite uses, named once.
 *
 * They were previously re-declared in three files, which is how they drift.
 * Two policies is deliberately all there is: a filtered read is fast or
 * something is wrong, and anything that does work on the appliance gets the
 * ceiling the deleted `callUntyped` escape hatch used to give every call.
 */

/** A filtered query. Fast, or something is wrong. */
export const readTimeoutMs = 30_000;

/**
 * A call that does work rather than reads.
 *
 * `disk.details` walks the whole inventory, `sharing.smb.delete` reloads the SMB
 * service, and `user.delete` can be slow on a busy appliance. All three had 60s
 * before the migration off `callUntyped` and keep it, rather than acquiring a
 * new flake source in exchange for tidier constants.
 */
export const slowCallTimeoutMs = 60_000;
