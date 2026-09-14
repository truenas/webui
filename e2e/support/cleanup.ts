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

/**
 * `TN_KEEP_TEST_DATA=1` leaves what a test created on the appliance, to inspect.
 * Opt-in on `=1`, not truthiness: `TN_KEEP_TEST_DATA=0` must not keep anything.
 * Cleanup still runs at the *start* of each test, so this changes only what a
 * run leaves behind, never what it finds.
 */
export const keepTestData = process.env.TN_KEEP_TEST_DATA === '1';

/**
 * Whether an `afterEach` should skip its cleanup, saying what it leaves.
 *
 *     test.afterEach(async ({ api }) => {
 *       if (leavingTestData(`bucket "${bucket}" and user "${owner}"`)) {
 *         return;
 *       }
 *       await cleanUp(api);
 *     });
 */
export function leavingTestData(what: string): boolean {
  if (keepTestData) {
    console.warn(`TN_KEEP_TEST_DATA=1 — leaving ${what}.`);
  }
  return keepTestData;
}

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
