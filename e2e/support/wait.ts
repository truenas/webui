/**
 * Polling for the API side of the suite.
 *
 * Playwright's `expect.poll` covers this inside a test, and specs should use it.
 * Fixtures cannot: a precondition or teardown failure is not an assertion about
 * the product, and dressing it as one buries the sentence that says what went
 * wrong and what it costs the next run behind `Expected: true, Received: false`.
 *
 * Middleware needs polling at all because many calls start a *job*: `pool.export`
 * and `service.control` return before the work is done, so the only honest test
 * of completion is to ask again (R8.3). Never `waitForTimeout` — wait on the
 * observable outcome.
 */

interface WaitOptions {
  /** Total time to keep asking before giving up. */
  timeoutMs: number;
  /**
   * What went wrong, and why it matters — thrown verbatim.
   *
   * Worth a full sentence. A leaked pool is discovered by the *next* run failing
   * for want of disks, so the message here is the only place that names the real
   * cause.
   */
  message: string;
  /** Gap between attempts. */
  intervalMs?: number;
}

const defaultIntervalMs = 2_000;

/**
 * Calls `isSatisfied` until it returns true, or throws when the deadline passes.
 *
 * Checked before the first sleep, so an already-satisfied condition costs
 * nothing. The deadline is tested after each attempt rather than before, so the
 * condition always gets at least one chance regardless of the timeout.
 *
 * **A throwing predicate is treated as "not yet", not as fatal.** The things
 * worth polling here are the ones that disrupt the connection used to poll
 * them: `ensurePoolAbsent` asks `pool.export` to restart services and then
 * queries middleware across that restart, so a query rejecting partway through
 * is the expected shape of the wait, not the end of it. Letting the first
 * rejection out would abort well inside the deadline and report an rxjs
 * `TimeoutError` instead of the sentence describing what it costs the next run.
 *
 * If the deadline does pass, the last error is attached — as `cause` and in the
 * text — so a genuine fault is still diagnosable rather than hidden behind
 * `message`.
 */
export async function waitUntil(
  isSatisfied: () => Promise<boolean>,
  { timeoutMs, message, intervalMs = defaultIntervalMs }: WaitOptions,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  for (;;) {
    try {
      if (await isSatisfied()) {
        return;
      }
      lastError = undefined;
    } catch (error) {
      lastError = error;
    }

    if (Date.now() > deadline) {
      if (lastError === undefined) {
        throw new Error(message);
      }
      const detail = lastError instanceof Error ? lastError.message : String(lastError);
      throw new Error(`${message} Last attempt failed with: ${detail}`, { cause: lastError });
    }

    await new Promise((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }
}
