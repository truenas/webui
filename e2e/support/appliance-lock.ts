/**
 * A readers–writer lock over the appliance, shared by every worker of one run.
 *
 * Specs that only touch entities they named themselves run in parallel: each
 * worker holds the lock *shared*. A spec that reshapes the box — a pool, a
 * service, a system setting, the admin's own preferences — cannot run beside
 * anything, so its worker holds the lock *exclusively*. Which kind a worker
 * takes is its project's `applianceAccess` option, set in `playwright.config.ts`.
 *
 * The lock is held for the worker's whole life, not per test, because
 * `beforeAll` and `afterAll` change state too and no test-scoped fixture covers
 * them. That is cheap: Playwright stops a worker as soon as nothing else queued
 * shares its hash, so a parallel worker lets go once its project's queue is
 * drained, which is exactly when the serial project's first worker starts.
 *
 * Holding it for life is also why an exclusive project must have no `workers`
 * limit — the config's `serial` project says why. A worker waiting for the lock
 * is busy as far as Playwright knows, so extra exclusive workers just queue up
 * behind the holder, which is what a limit would have done.
 *
 * Separately, {@link withRunMutex} keeps a *lane* — a set of shared specs that
 * break each other but nothing else, the `data-protection` project — to one test
 * at a time. That one is per test, so it cannot be held by an idle worker.
 *
 * Ordering is the scheduler's job; correctness is this lock's. The config lists
 * the shared projects before the exclusive ones, and Playwright hands out
 * queued groups first-in-first-out, so the serial specs start only when the
 * shared ones have all been handed out. The lock covers the overlap at that
 * boundary, a shared spec retried after the serial ones started, and the two
 * exclusive projects (`serial`, `unpublished`) taking turns.
 *
 * ## Why files, not a project dependency
 *
 * A `dependencies` chain would order the projects without any of this, but a
 * failure in a dependency skips every dependent: one red parallel test would
 * hide the whole serial half of the run. `teardown` runs regardless, but a
 * teardown project is pulled in unfiltered by `--grep`, a file argument or
 * `--shard`, so asking for one parallel spec would run every serial one.
 *
 * ## The protocol
 *
 * One directory per run, made by the config in the runner process and handed
 * to workers through `TN_APPLIANCE_LOCK_DIR`. Inside it, `writer/` exists while
 * a worker holds the lock exclusively (`mkdir` is atomic, so two writers cannot
 * both make it), and `readers/<pid>` exists for each worker holding it shared.
 *
 * Both sides check, claim, then check again, so whichever claims second sees
 * the other and backs off:
 *
 * - A writer waits for `readers/` to empty, makes `writer/` with its pid, then
 *   checks `readers/` again — a reader may have registered in between — and
 *   removes `writer/` and starts over if so.
 * - A reader waits for `writer/` to be absent, writes `readers/<pid>`, then
 *   checks `writer/` again, and removes its entry and starts over if so.
 *
 * A writer does not claim the lock while it waits, so readers do not yield to a
 * *waiting* writer. That is deliberate. A reader arriving once the serial specs
 * are queued is a shared spec's retry, or a second worker of the
 * `data-protection` project, which Playwright briefly starts beside the first;
 * shutting either out would leave the idle first one holding its share, and the
 * writer waiting on it for good. Starving the writer is not a risk: no new
 * shared work is queued once the serial specs are.
 *
 * A worker killed without tearing down leaves its file behind, so every entry
 * is checked against a live pid and a dead one's is cleared.
 */
import {
  mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type ApplianceAccess = 'shared' | 'exclusive';

const lockDirVar = 'TN_APPLIANCE_LOCK_DIR';
const pollMs = 500;

/**
 * Makes this run's lock directory, once, in the runner process.
 *
 * Called from `playwright.config.ts`, which every worker evaluates again — the
 * guard keeps them on the directory the runner made, which they inherit
 * through the environment.
 */
export function prepareApplianceLock(): void {
  if (!process.env[lockDirVar]) {
    process.env[lockDirVar] = mkdtempSync(join(tmpdir(), 'tn-e2e-appliance-lock-'));
  }
}

function lockDir(): string {
  const dir = process.env[lockDirVar];
  if (!dir) {
    throw new Error(`${lockDirVar} is unset; playwright.config.ts calls prepareApplianceLock() to set it.`);
  }
  return dir;
}

function isAlive(pid: number): boolean {
  try {
    // Signal 0 checks for the process without sending anything.
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means it exists under another user, which is still alive.
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function writerDir(): string {
  return join(lockDir(), 'writer');
}

function readersDir(): string {
  return join(lockDir(), 'readers');
}

/** The pid holding `writer/`, or undefined when no live worker does. Clears a dead one's. */
function liveWriter(): number | undefined {
  let pid: number;
  try {
    pid = Number(readFileSync(join(writerDir(), 'pid'), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    // Either no writer, or one that made the directory and has not written its
    // pid yet. Only the second leaves the directory behind.
    try {
      readdirSync(writerDir());
      return -1;
    } catch {
      return undefined;
    }
  }

  if (isAlive(pid)) {
    return pid;
  }
  rmSync(writerDir(), { recursive: true, force: true });
  return undefined;
}

/** Pids of live readers other than this process. Clears dead ones' entries. */
function otherLiveReaders(): number[] {
  let entries: string[];
  try {
    entries = readdirSync(readersDir());
  } catch {
    return [];
  }

  return entries.map(Number).filter((pid) => {
    if (pid === process.pid) {
      return false;
    }
    if (isAlive(pid)) {
      return true;
    }
    rmSync(join(readersDir(), String(pid)), { force: true });
    return false;
  });
}

/**
 * Waits about `ms`, jittered, so two workers backing off from each other do not
 * keep retrying in step.
 */
async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms * (0.5 + Math.random()));
  });
}

async function acquireExclusive(): Promise<void> {
  for (;;) {
    if (!otherLiveReaders().length && claimWriter()) {
      if (!otherLiveReaders().length) {
        return;
      }
      rmSync(writerDir(), { recursive: true, force: true });
    }
    await sleep(pollMs);
  }
}

/** Makes `writer/` for this process; false when another writer, live or dead, has it. */
function claimWriter(): boolean {
  try {
    mkdirSync(writerDir());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
    // Clears it when its holder is dead, for the next attempt.
    liveWriter();
    return false;
  }

  writeFileSync(join(writerDir(), 'pid'), String(process.pid));
  return true;
}

async function acquireShared(): Promise<void> {
  mkdirSync(readersDir(), { recursive: true });
  const entry = join(readersDir(), String(process.pid));

  for (;;) {
    if (liveWriter() === undefined) {
      writeFileSync(entry, '');
      if (liveWriter() === undefined) {
        return;
      }
      rmSync(entry, { force: true });
    }
    await sleep(pollMs);
  }
}

/** Takes the lock for this worker, waiting as long as it takes. Resolves to its release. */
export async function acquireApplianceLock(access: ApplianceAccess): Promise<() => void> {
  if (access === 'exclusive') {
    await acquireExclusive();
    return () => rmSync(writerDir(), { recursive: true, force: true });
  }

  await acquireShared();
  return () => rmSync(join(readersDir(), String(process.pid)), { force: true });
}

/**
 * Runs `fn` while no other worker of this run is inside `withRunMutex(name)`.
 *
 * For one-off work several shared workers can race to start — building the
 * suite's pool, which two workers starting together would otherwise both find
 * missing and both try to build.
 */
export async function withRunMutex<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const dir = join(lockDir(), `mutex-${name}`);
  for (;;) {
    try {
      mkdirSync(dir);
      writeFileSync(join(dir, 'pid'), String(process.pid));
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
      try {
        if (!isAlive(Number(readFileSync(join(dir, 'pid'), 'utf8')))) {
          rmSync(dir, { recursive: true, force: true });
        }
      } catch {
        // Pid not written yet: its holder is between the two calls above.
      }
      await sleep(pollMs);
    }
  }

  try {
    return await fn();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
