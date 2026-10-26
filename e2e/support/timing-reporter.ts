/**
 * Records where each test's time went, for `yarn e2e:timings`.
 *
 * JUnit and the list reporter give one number per test, and it is not even the
 * whole of it: Playwright leaves `beforeAll` and `afterAll` hooks, and the
 * worker-scoped fixtures a test is the first to need, out of a test's duration.
 * On a run where the apps specs install their apps in `beforeAll`, that was
 * minutes per shard that no test was charged for. This reads the step tree
 * instead, where those hooks are, and writes per test attempt:
 *
 * - its span, from its first step to its last, beside the duration Playwright
 *   reports;
 * - each hook and fixture it ran before and after the body, by name and with
 *   its own time — the `page` fixture being the sign-in every authenticated
 *   test pays;
 * - the body's span, and how much of it went to browser actions and to
 *   `expect` waits.
 *
 * Only hook and fixture names are kept, never the titles of the steps inside
 * them or in the body. A browser action's title carries what it typed —
 * `Fill "<the password>"` — and this file is published with the run, including
 * for the `unpublished` project. The middleware side is `timings.ts`.
 *
 * Written once, at the end, to `tests.json` in the directory `timings.ts`
 * records into.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  FullConfig, Reporter, TestCase, TestResult, TestStep,
} from '@playwright/test/reporter';
import { timingsDirVar } from './timings';

export interface PhaseTiming {
  /** `beforeEach hook`, `afterAll hook`, `Fixture "page"`, … */
  title: string;
  /** Epoch milliseconds. */
  start: number;
  durationMs: number;
}

export interface TestTiming {
  /** Relative to `e2e/`, as the coverage records name it. */
  file: string;
  line: number;
  title: string;
  project: string;
  retry: number;
  status: TestResult['status'];
  parallelIndex: number;
  /** Epoch milliseconds: the first step's start, and the last step's end. */
  start: number;
  end: number;
  /** What JUnit shows for this attempt. */
  reportedMs: number;
  before: PhaseTiming[];
  after: PhaseTiming[];
  body: {
    start: number;
    end: number;
    /** Browser actions and `expect` waits, outside any hook. */
    actionsMs: number;
    expectMs: number;
  };
}

export interface RunTimings {
  /** `1/2`, or absent for an unsharded run. */
  shard?: string;
  start: number;
  end: number;
  tests: TestTiming[];
}

function stepEnd(step: TestStep): number {
  return step.startTime.getTime() + step.duration;
}

/** Browser actions and `expect` waits under `steps`, without counting a nested one twice. */
function bodyTotals(steps: TestStep[]): { actionsMs: number; expectMs: number } {
  let actionsMs = 0;
  let expectMs = 0;
  for (const step of steps) {
    if (step.category === 'pw:api') {
      actionsMs += step.duration;
    } else if (step.category === 'expect') {
      expectMs += step.duration;
    } else {
      const nested = bodyTotals(step.steps);
      actionsMs += nested.actionsMs;
      expectMs += nested.expectMs;
    }
  }
  return { actionsMs, expectMs };
}

function phases(step: TestStep | undefined): PhaseTiming[] {
  return (step?.steps ?? [])
    .filter((child) => child.category === 'hook' || child.category === 'fixture')
    .map((child) => ({ title: child.title, start: child.startTime.getTime(), durationMs: child.duration }));
}

function describe(test: TestCase, result: TestResult): TestTiming {
  const isHooks = (title: string) => (step: TestStep): boolean => step.category === 'hook' && step.title === title;
  const before = result.steps.find(isHooks('Before Hooks'));
  const after = result.steps.find(isHooks('After Hooks'));
  const body = result.steps.filter((step) => step !== before && step !== after);

  const resultStart = result.startTime.getTime();
  const start = Math.min(resultStart, ...result.steps.map((step) => step.startTime.getTime()));
  const end = Math.max(resultStart + result.duration, ...result.steps.map(stepEnd));
  const bodyStart = before ? stepEnd(before) : start;

  return {
    file: test.location.file.replace(/^.*\/e2e\//, ''),
    line: test.location.line,
    title: test.titlePath().slice(3).join(' › '),
    project: test.parent.project()?.name ?? '',
    retry: result.retry,
    status: result.status,
    parallelIndex: result.parallelIndex,
    start,
    end,
    reportedMs: result.duration,
    before: phases(before),
    after: phases(after),
    body: {
      start: bodyStart,
      end: after ? after.startTime.getTime() : end,
      ...bodyTotals(body),
    },
  };
}

export default class TimingReporter implements Reporter {
  private run: RunTimings = { start: Date.now(), end: 0, tests: [] };

  onBegin(config: FullConfig): void {
    this.run = {
      shard: config.shard ? `${config.shard.current}/${config.shard.total}` : undefined,
      start: Date.now(),
      end: 0,
      tests: [],
    };
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.run.tests.push(describe(test, result));
  }

  onEnd(): void {
    this.run.end = Date.now();
    const timingsDir = process.env[timingsDirVar];
    if (!timingsDir) {
      return;
    }
    const timingsFile = join(timingsDir, 'tests.json');
    try {
      mkdirSync(timingsDir, { recursive: true });
      writeFileSync(timingsFile, JSON.stringify(this.run));
    } catch (error) {
      console.warn(`Could not write test timings to ${timingsFile}: ${String(error)}`);
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}
