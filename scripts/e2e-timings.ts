#!/usr/bin/env tsx

/**
 * Reports where the E2E suite's time goes.
 *
 *     yarn e2e                 # writes test-results/e2e-timings/
 *     yarn e2e:timings         # reads it, prints markdown
 *
 * Two records go in, both written by the suite:
 *
 * - `tests.json`, from `e2e/support/timing-reporter.ts`: each test attempt's span and its phases —
 *   every hook and fixture before and after the body, and the body itself.
 * - `middleware-<pid>.jsonl`, from `e2e/support/timings.ts`: every middleware request and job, by
 *   method name and time.
 *
 * A middleware call is charged to the test, and the phase of it, that was running when the call
 * started. That is how a `beforeAll` hook's calls are found: Playwright leaves the hook out of a
 * test's reported duration, but not out of its step tree. Middleware time in a phase is the union
 * of the calls and jobs in it, so a job and the polls inside it are not counted twice.
 *
 * Usage: `yarn e2e:timings [results-dir] [--out <file>]`. The directory holds one run's records, or
 * one subdirectory per shard, each holding its shard's — which is how CI lays out the shards'
 * artifacts. Markdown goes to stdout, and to `--out` when given; each test's breakdown is written
 * next to the records as `summary.json`.
 */

import {
  existsSync, readdirSync, readFileSync, statSync, writeFileSync,
} from 'fs';
import { join, relative, resolve } from 'path';
import type { RunTimings, TestTiming } from '../e2e/support/timing-reporter';
import type { MiddlewareTiming } from '../e2e/support/timings';

// `yarn` runs scripts from the repository root.
const repoRoot = process.cwd();

interface Shard {
  name: string;
  run: RunTimings;
  middleware: MiddlewareTiming[];
}

/** Disjoint, sorted intervals of middleware activity, so overlap with any span is a lookup. */
type Busy = [number, number][];

interface Breakdown {
  shard: string;
  test: TestTiming;
  totalMs: number;
  groups: Map<string, { ms: number; middlewareMs: number }>;
  middlewareMs: number;
  /** Middleware time by `method` (calls) or `method (job)`, from the calls that started in this test. */
  byMethod: Map<string, number>;
}

const bodyGroup = 'Test body';
const signInGroup = 'Page and sign-in';

/** The groups the report shows in this order; any other is listed after them. */
const groupOrder = [
  signInGroup, 'Browser launch', 'beforeAll', 'beforeEach', bodyGroup, 'afterEach', 'afterAll',
];

function groupOf(title: string): string {
  if (title === 'Fixture "page"' || title === 'Fixture "context"') {
    return signInGroup;
  }
  if (title === 'Fixture "browser"') {
    return 'Browser launch';
  }
  const hook = /^(beforeAll|beforeEach|afterEach|afterAll) hook$/.exec(title);
  if (hook) {
    return hook[1];
  }
  const fixture = /^Fixture "(.*)"$/.exec(title);
  return fixture ? `Fixture \`${fixture[1]}\`` : title;
}

function readShard(dir: string, name: string): Shard {
  const run = JSON.parse(readFileSync(join(dir, 'tests.json'), 'utf8')) as RunTimings;
  const middleware = readdirSync(dir)
    .filter((file) => file.startsWith('middleware-') && file.endsWith('.jsonl'))
    .flatMap((file) => readFileSync(join(dir, file), 'utf8').split('\n'))
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as MiddlewareTiming);
  return { name: run.shard ?? name, run, middleware };
}

function readShards(dir: string): Shard[] {
  if (existsSync(join(dir, 'tests.json'))) {
    return [readShard(dir, '1/1')];
  }
  return readdirSync(dir)
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isDirectory() && existsSync(join(path, 'tests.json')))
    .sort((a, b) => a.localeCompare(b))
    .map((path) => readShard(path, relative(dir, path)));
}

function busyIntervals(timings: MiddlewareTiming[]): Busy {
  const sorted = timings
    .map((timing): [number, number] => [timing.start, timing.start + timing.durationMs])
    .sort((a, b) => a[0] - b[0]);
  const merged: Busy = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/** How much of `[from, to)` `busy` covers. */
function overlap(busy: Busy, from: number, to: number): number {
  // First interval that ends after `from`.
  let low = 0;
  let high = busy.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (busy[middle][1] <= from) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  let total = 0;
  for (let index = low; index < busy.length && busy[index][0] < to; index++) {
    total += Math.min(to, busy[index][1]) - Math.max(from, busy[index][0]);
  }
  return total;
}

function methodKey(timing: MiddlewareTiming): string {
  return timing.kind === 'job' ? `${timing.method} (job)` : timing.method;
}

function breakDown(shard: Shard): { breakdowns: Breakdown[]; outsideMs: number; outsideMiddlewareMs: number } {
  const byParallelIndex = new Map<number | undefined, MiddlewareTiming[]>();
  for (const timing of shard.middleware) {
    const timings = byParallelIndex.get(timing.parallelIndex) ?? [];
    timings.push(timing);
    byParallelIndex.set(timing.parallelIndex, timings);
  }
  const busyByIndex = new Map([...byParallelIndex].map(([index, timings]) => [index, busyIntervals(timings)]));

  const breakdowns = shard.run.tests.map((test): Breakdown => {
    const busy = busyByIndex.get(test.parallelIndex) ?? [];
    const groups = new Map<string, { ms: number; middlewareMs: number }>();
    const add = (group: string, start: number, ms: number): void => {
      const entry = groups.get(group) ?? { ms: 0, middlewareMs: 0 };
      entry.ms += ms;
      entry.middlewareMs += overlap(busy, start, start + ms);
      groups.set(group, entry);
    };
    for (const phase of [...test.before, ...test.after]) {
      add(groupOf(phase.title), phase.start, phase.durationMs);
    }
    add(bodyGroup, test.body.start, Math.max(0, test.body.end - test.body.start));

    const byMethod = new Map<string, number>();
    for (const timing of byParallelIndex.get(test.parallelIndex) ?? []) {
      if (timing.start >= test.start && timing.start < test.end) {
        byMethod.set(methodKey(timing), (byMethod.get(methodKey(timing)) ?? 0) + timing.durationMs);
      }
    }

    return {
      shard: shard.name,
      test,
      totalMs: test.end - test.start,
      groups,
      middlewareMs: overlap(busy, test.start, test.end),
      byMethod,
    };
  });

  // Between tests: worker start-up and shutdown, and anything else no test's steps cover.
  const spans = busyIntervals(shard.run.tests.map((test): MiddlewareTiming => ({
    kind: 'call', method: '', start: test.start, durationMs: test.end - test.start, answered: true,
  })));
  const inTests = overlap(spans, shard.run.start, shard.run.end);
  const outsideMs = Math.max(0, shard.run.end - shard.run.start - inTests);
  const allBusy = busyIntervals(shard.middleware);
  const outsideMiddlewareMs = overlap(allBusy, shard.run.start, shard.run.end)
    - spans.reduce((sum, [start, end]) => sum + overlap(allBusy, start, end), 0);

  return { breakdowns, outsideMs, outsideMiddlewareMs: Math.max(0, outsideMiddlewareMs) };
}

function duration(ms: number): string {
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${(ms / 60_000).toFixed(1)}m`;
}

function percent(part: number, whole: number): string {
  return whole ? `${Math.round(part / whole * 100)}%` : '–';
}

function cell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function topMethod(byMethod: Map<string, number>): string {
  // A job's polls are inside its span; naming them would only repeat the job.
  const [top] = [...byMethod]
    .filter(([method]) => method !== 'core.get_jobs')
    .sort((a, b) => b[1] - a[1]);
  return top ? `\`${top[0]}\` ${duration(top[1])}` : '';
}

function main(): void {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const outFile = outIndex >= 0 ? args.splice(outIndex, 2)[1] : undefined;
  const resultsDir = resolve(args[0] ?? join(repoRoot, 'test-results/e2e-timings'));

  if (!existsSync(resultsDir)) {
    console.error(`No timings in ${relative(repoRoot, resultsDir)}. Run the suite first: yarn e2e`);
    process.exit(1);
  }

  const shards = readShards(resultsDir);
  if (!shards.length) {
    console.error(`No tests.json in ${relative(repoRoot, resultsDir)} or its subdirectories.`);
    process.exit(1);
  }

  const perShard = shards.map((shard) => ({ shard, ...breakDown(shard) }));
  const breakdowns = perShard.flatMap((entry) => entry.breakdowns);
  const totalTestMs = breakdowns.reduce((sum, entry) => sum + entry.totalMs, 0);
  const totalOutsideMs = perShard.reduce((sum, entry) => sum + entry.outsideMs, 0);

  // Where the time went, over every attempt.
  const groupTotals = new Map<string, { ms: number; middlewareMs: number; attempts: number }>();
  for (const entry of breakdowns) {
    for (const [group, { ms, middlewareMs }] of entry.groups) {
      const total = groupTotals.get(group) ?? { ms: 0, middlewareMs: 0, attempts: 0 };
      total.ms += ms;
      total.middlewareMs += middlewareMs;
      total.attempts += 1;
      groupTotals.set(group, total);
    }
  }
  const actionsMs = breakdowns.reduce((sum, entry) => sum + entry.test.body.actionsMs, 0);
  const expectMs = breakdowns.reduce((sum, entry) => sum + entry.test.body.expectMs, 0);
  const rank = (group: string): number => {
    const index = groupOrder.indexOf(group);
    return index < 0 ? groupOrder.length : index;
  };
  const orderedGroups = [...groupTotals].sort((a, b) => rank(a[0]) - rank(b[0]) || b[1].ms - a[1].ms);
  const wholeMs = totalTestMs + totalOutsideMs;

  // Middleware, by method.
  const methodStats = (kind: MiddlewareTiming['kind']): string[] => {
    const stats = new Map<string, { count: number; ms: number; max: number; unanswered: number }>();
    for (const timing of shards.flatMap((shard) => shard.middleware)) {
      if (timing.kind !== kind) {
        continue;
      }
      const stat = stats.get(timing.method) ?? {
        count: 0, ms: 0, max: 0, unanswered: 0,
      };
      stat.count += 1;
      stat.ms += timing.durationMs;
      stat.max = Math.max(stat.max, timing.durationMs);
      stat.unanswered += timing.answered ? 0 : 1;
      stats.set(timing.method, stat);
    }
    return [...stats]
      .sort((a, b) => b[1].ms - a[1].ms)
      .slice(0, 25)
      .map(([method, stat]) => `| \`${method}\` | ${stat.count} | ${duration(stat.ms)} | ${duration(stat.ms / stat.count)} `
        + `| ${duration(stat.max)} | ${stat.unanswered || ''} |`);
  };

  // By file, hooks included.
  const files = new Map<string, { ms: number; attempts: number; allHooksMs: number }>();
  for (const entry of breakdowns) {
    const file = files.get(entry.test.file) ?? { ms: 0, attempts: 0, allHooksMs: 0 };
    file.ms += entry.totalMs;
    file.attempts += 1;
    file.allHooksMs += (entry.groups.get('beforeAll')?.ms ?? 0) + (entry.groups.get('afterAll')?.ms ?? 0);
    files.set(entry.test.file, file);
  }

  const unreportedMs = breakdowns.reduce((sum, entry) => sum + Math.max(0, entry.totalMs - entry.test.reportedMs), 0);

  const lines = [
    '# E2E timings',
    '',
    `${breakdowns.length} test attempts over ${shards.length} shard${shards.length === 1 ? '' : 's'}. `
    + 'Each attempt\'s span runs from its first step to its last, so it includes the `beforeAll` and `afterAll` '
    + `hooks and worker fixtures Playwright leaves out of a test's reported duration — ${duration(unreportedMs)} of them here. `
    + 'See `scripts/e2e-timings.ts`.',
    '',
    '| Shard | Wall | In tests | Between tests | Attempts |',
    '|---|---:|---:|---:|---:|',
    ...perShard.map(({ shard, breakdowns: shardBreakdowns, outsideMs }) => {
      const inTests = shardBreakdowns.reduce((sum, entry) => sum + entry.totalMs, 0);
      return `| ${shard.name} | ${duration(shard.run.end - shard.run.start)} | ${duration(inTests)} | ${duration(outsideMs)} `
        + `| ${shardBreakdowns.length} |`;
    }),
    '',
    '## Where the time went',
    '',
    'Middleware is the time at least one request or job was outstanding; the rest of a phase is the browser, '
    + 'the runner, or waiting between polls.',
    '',
    '| Phase | Time | Share | Attempts | Mean | Of which middleware |',
    '|---|---:|---:|---:|---:|---:|',
    ...orderedGroups.map(([group, total]) => {
      return `| ${group} | ${duration(total.ms)} | ${percent(total.ms, wholeMs)} | ${total.attempts} `
        + `| ${duration(total.ms / total.attempts)} | ${duration(total.middlewareMs)} (${percent(total.middlewareMs, total.ms)}) |`;
    }),
    `| Between tests | ${duration(totalOutsideMs)} | ${percent(totalOutsideMs, wholeMs)} | | | `
    + `${duration(perShard.reduce((sum, entry) => sum + entry.outsideMiddlewareMs, 0))} |`,
    '',
    `In the test bodies, ${duration(actionsMs)} went to browser actions and ${duration(expectMs)} to \`expect\` waits.`,
    '',
    '## Slowest tests',
    '',
    '| Test | Shard | Total | Before body | Body | After body | Middleware | Most of it |',
    '|---|---|---:|---:|---:|---:|---:|---|',
    ...[...breakdowns].sort((a, b) => b.totalMs - a.totalMs).slice(0, 30).map((entry) => {
      const bodyMs = entry.groups.get(bodyGroup)?.ms ?? 0;
      const beforeMs = entry.test.before.reduce((sum, phase) => sum + phase.durationMs, 0);
      const afterMs = entry.test.after.reduce((sum, phase) => sum + phase.durationMs, 0);
      const retry = entry.test.retry ? ` (retry ${entry.test.retry})` : '';
      return `| \`${entry.test.file}:${entry.test.line}\` ${cell(entry.test.title)}${retry} | ${entry.shard} `
        + `| ${duration(entry.totalMs)} | ${duration(beforeMs)} | ${duration(bodyMs)} | ${duration(afterMs)} `
        + `| ${duration(entry.middlewareMs)} | ${topMethod(entry.byMethod)} |`;
    }),
    '',
    '## Slowest files',
    '',
    '| File | Total | Attempts | `beforeAll` + `afterAll` |',
    '|---|---:|---:|---:|',
    ...[...files].sort((a, b) => b[1].ms - a[1].ms).slice(0, 20)
      .map(([file, stat]) => `| \`${file}\` | ${duration(stat.ms)} | ${stat.attempts} | ${stat.allHooksMs ? duration(stat.allHooksMs) : ''} |`),
    '',
    '## Middleware jobs',
    '',
    'From start until the suite saw the job finish.',
    '',
    '| Method | Jobs | Total | Mean | Max | Not finished |',
    '|---|---:|---:|---:|---:|---:|',
    ...methodStats('job'),
    '',
    '## Middleware calls',
    '',
    'Each request until its reply. `core.get_jobs` is mostly the job polls above. '
    + '`(connect and sign in)` is a new connection, which `withClient` opens every time.',
    '',
    '| Method | Calls | Total | Mean | Max | Unanswered |',
    '|---|---:|---:|---:|---:|---:|',
    ...methodStats('call'),
  ];

  const markdown = `${lines.join('\n')}\n`;
  process.stdout.write(markdown);
  if (outFile) {
    writeFileSync(outFile, markdown);
  }

  writeFileSync(join(resultsDir, 'summary.json'), JSON.stringify(breakdowns.map((entry) => ({
    shard: entry.shard,
    file: entry.test.file,
    line: entry.test.line,
    title: entry.test.title,
    project: entry.test.project,
    retry: entry.test.retry,
    status: entry.test.status,
    totalMs: entry.totalMs,
    reportedMs: entry.test.reportedMs,
    middlewareMs: entry.middlewareMs,
    phases: Object.fromEntries(entry.groups),
    byMethod: Object.fromEntries([...entry.byMethod].sort((a, b) => b[1] - a[1])),
  })), null, 2));
}

main();
