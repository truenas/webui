/**
 * Teardown that keeps going.
 *
 * Every step runs even when an earlier one throws, and the failures are
 * reported together. Plain sequential `await`s meant one failing call abandoned
 * the rest, so a `user.delete` that kept failing would wedge the suite: the
 * `afterEach` would leak a pool, and the retry's `beforeEach` would throw at the
 * same first call and never reach the export either.
 *
 * Order still matters — callers list steps in the order things depend on each
 * other (stop the service, then remove what it served, then the storage under
 * that) — this only guarantees that a failure early in the list does not skip
 * the later, usually more expensive, steps.
 */

export type CleanupStep = [what: string, run: () => Promise<unknown>];

export async function runCleanupSteps(steps: CleanupStep[]): Promise<void> {
  const failures: string[] = [];

  for (const [what, run] of steps) {
    try {
      await run();
    } catch (error) {
      failures.push(`${what} — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    const bulleted = failures.map((failure) => `  • ${failure}`).join('\n');
    throw new Error(`Cleanup did not complete:\n${bulleted}`);
  }
}
