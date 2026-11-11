/**
 * Teardown that keeps going: every step runs even when an earlier one throws, and failures are reported
 * together. Otherwise one persistently failing call (say `user.delete`) leaks a pool in `afterEach` and the
 * retry's `beforeEach` throws at the same call, wedging the suite. Callers still list steps in dependency
 * order (service, then what it served, then the storage under that).
 */

/**
 * `TN_KEEP_TEST_DATA=1` leaves what a test created on the appliance, to inspect.
 * Opt-in on `=1`, not truthiness: `TN_KEEP_TEST_DATA=0` must not keep anything.
 * Cleanup still runs at the *start* of each test, so this changes only what a
 * run leaves behind, never what it finds.
 */
export const keepTestData = process.env.TN_KEEP_TEST_DATA === '1';

/**
 * Whether an `afterEach` should skip its cleanup, logging what it leaves behind.
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
