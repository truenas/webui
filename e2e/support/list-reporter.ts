/**
 * The suite's console output: one line per test result, then the tally.
 *
 * Replaces Playwright's built-in `list` reporter, whose line opens with the
 * project name and ends with the duration — after a title of any length, so
 * the durations never line up and cannot be read down the page. Here a line is
 *
 *   ✅  137  [  3.9m] > e2e/tests/periodic-snapshot-tasks.e2e.ts:381:1 > switching a task off …
 *
 * with the run time at a fixed column and no `[authenticated]` tag: the project
 * is on nearly every line, and when it matters the spec's path already says it.
 *
 * ## What must not change
 *
 * The end of the output mirrors Playwright 1.56's base reporter word for word,
 * because it is read by people and by tooling outside this repository:
 *
 * - `N passed (30.6m)`, `N skipped` and above all `N flaky`. A test that fails
 *   and then passes on its CI retry is a clean pass in `junit.xml` — no
 *   `<failure>`, no retry attribute — so the flaky line in the log is the only
 *   place it is visible at all.
 * - `Slow test file:`, which is how a five-minute spec gets noticed.
 *
 * Failures are listed in full before the tally, as `list` did. The `junit` and
 * `html` reporters beside this one in `playwright.config.ts` are untouched.
 */
import { relative } from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
} from '@playwright/test/reporter';

const passedMark = '✅';
const failedMark = '❌';
const skippedMark = '➖';

/** Wide enough for every value `formatDuration` produces, e.g. `999ms`, `59.9m`. */
const durationWidth = 5;

const parallelDocsUrl = 'https://playwright.dev/docs/test-parallel';

/** Playwright's own duration format, so the tally reads as it always has. */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  return `${(hours / 24).toFixed(1)}d`;
}

function plural(count: number, noun: string): string {
  return count === 1 ? noun : `${noun}s`;
}

/** The spec's path as the shell running the suite would write it. */
function testFile(test: TestCase): string {
  return relative(process.cwd(), test.location.file);
}

/** `file:line:col > describe > title` — the title path without project or file. */
function testTitle(test: TestCase): string {
  const location = `${testFile(test)}:${test.location.line}:${test.location.column}`;
  return [location, ...test.titlePath().slice(3)].join(' > ');
}

function statusMark(test: TestCase, result: TestResult): string {
  if (result.status === 'skipped') {
    return skippedMark;
  }
  return result.status === test.expectedStatus ? passedMark : failedMark;
}

function indent(text: string, prefix: string): string {
  return text.split('\n').map((line) => (line ? `${prefix}${line}` : line)).join('\n');
}

/**
 * The message, the source snippet, then the stack — the order Playwright uses.
 * A stack opens with the message, so the message is taken from it when there is
 * one; frames inside `node_modules` are Playwright's own and say nothing.
 */
function formatError(error: TestError): string {
  const stackLines = (error.stack ?? '').split('\n');
  const firstFrame = stackLines.findIndex((line) => /^\s*at /.test(line));
  const message = error.stack && firstFrame > 0
    ? stackLines.slice(0, firstFrame).join('\n')
    : (error.message ?? error.value ?? '');
  const frames = firstFrame < 0
    ? []
    : stackLines.slice(firstFrame).filter((line) => !line.includes('node_modules'));

  const parts = [message];
  if (error.snippet) {
    parts.push('', error.snippet);
  }
  if (frames.length) {
    parts.push('', ...frames);
  }
  return parts.join('\n');
}

function formatResultFailure(test: TestCase, result: TestResult): string[] {
  const lines: string[] = [];
  if (result.status === 'passed' && test.expectedStatus === 'failed') {
    lines.push('Expected to fail, but passed.');
  }
  if (result.status === 'interrupted') {
    lines.push('Test was interrupted.');
  }
  lines.push(...result.errors.map((error) => formatError(error)));
  result.attachments
    .filter((attachment) => attachment.path)
    .forEach((attachment) => {
      const where = relative(process.cwd(), attachment.path ?? '');
      lines.push(`attachment: ${attachment.name} (${attachment.contentType}) ${where}`);
    });
  return lines;
}

function formatFailure(test: TestCase, index: number): string {
  const lines = [`  ${index}) ${testTitle(test)}`, ''];
  test.results.forEach((result) => {
    const details = formatResultFailure(test, result);
    if (!details.length) {
      return;
    }
    if (result.retry) {
      lines.push(`    Retry #${result.retry}`, '');
    }
    details.forEach((detail) => lines.push(indent(detail, '    '), ''));
  });
  return lines.join('\n');
}

interface FileDuration {
  duration: number;
  workers: Set<number>;
}

export default class ListReporter implements Reporter {
  private config: FullConfig | undefined;
  private suite: Suite | undefined;
  private indexWidth = 1;
  private resultCount = 0;
  private readonly fileDurations = new Map<string, FileDuration>();
  private readonly fatalErrors: TestError[] = [];

  printsToStdio(): boolean {
    return true;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
    const total = suite.allTests().length;
    this.indexWidth = String(total).length;

    const workers = config.workers;
    const shard = config.shard ? `, shard ${config.shard.current} of ${config.shard.total}` : '';
    const tests = plural(total, 'test');
    const workerNoun = plural(workers, 'worker');
    this.write(`\nRunning ${total} ${tests} using ${workers} ${workerNoun}${shard}\n`);
  }

  onStdOut(chunk: string | Buffer): void {
    process.stdout.write(chunk);
  }

  onStdErr(chunk: string | Buffer): void {
    process.stderr.write(chunk);
  }

  onError(error: TestError): void {
    this.fatalErrors.push(error);
    this.write(`\n${formatError(error)}\n`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.resultCount += 1;
    const index = String(this.resultCount).padStart(this.indexWidth);
    const duration = formatDuration(result.duration).padStart(durationWidth);
    const retry = result.retry ? ` (retry #${result.retry})` : '';
    this.write(`${statusMark(test, result)}  ${index}  [${duration}] > ${testTitle(test)}${retry}`);

    const file = testFile(test);
    const entry = this.fileDurations.get(file) ?? { duration: 0, workers: new Set<number>() };
    entry.duration += result.duration;
    entry.workers.add(result.workerIndex);
    this.fileDurations.set(file, entry);
  }

  onEnd(result: FullResult): void {
    const tests = this.suite?.allTests() ?? [];
    const unexpected = tests.filter((test) => test.outcome() === 'unexpected');
    const flaky = tests.filter((test) => test.outcome() === 'flaky');
    const skippedTests = tests.filter((test) => test.outcome() === 'skipped');
    const interrupted = skippedTests.filter((test) => {
      return test.results.some((run) => run.status === 'interrupted');
    });
    const notInterrupted = skippedTests.filter((test) => !interrupted.includes(test));
    const didNotRun = notInterrupted.filter((test) => {
      return !test.results.length || test.expectedStatus !== 'skipped';
    });
    const skipped = notInterrupted.length - didNotRun.length;
    const expected = tests.filter((test) => test.outcome() === 'expected').length;

    const failures = [
      ...unexpected,
      ...flaky,
      ...interrupted.filter((test) => test.results.some((run) => run.error)),
    ];
    if (failures.length) {
      this.write('');
      failures.forEach((test, index) => this.write(formatFailure(test, index + 1)));
    }

    this.writeSlowFiles();

    const lines: string[] = [];
    if (unexpected.length) {
      lines.push(`  ${unexpected.length} failed`);
    }
    if (interrupted.length) {
      lines.push(`  ${interrupted.length} interrupted`);
    }
    if (flaky.length) {
      lines.push(`  ${flaky.length} flaky`);
    }
    if (skipped) {
      lines.push(`  ${skipped} skipped`);
    }
    if (didNotRun.length) {
      lines.push(`  ${didNotRun.length} did not run`);
    }
    if (expected) {
      lines.push(`  ${expected} passed (${formatDuration(result.duration)})`);
    }
    const ranAny = expected + unexpected.length + interrupted.length + flaky.length > 0;
    if (this.fatalErrors.length && ranAny) {
      const count = this.fatalErrors.length === 1
        ? '1 error was not a part of any test'
        : `${this.fatalErrors.length} errors were not a part of any test`;
      lines.push(`  ${count}, see above for details`);
    }
    this.write(`\n${lines.join('\n')}`);
  }

  /**
   * Playwright's rule: files over `reportSlowTests.threshold`, slowest first,
   * at most `max` of them — and only files that ran in a single worker, since a
   * file split across workers was not one slow serial stretch.
   */
  private writeSlowFiles(): void {
    const slowTests = this.config?.reportSlowTests;
    if (!slowTests) {
      return;
    }

    const slowFiles = [...this.fileDurations.entries()]
      .filter(([, entry]) => entry.workers.size === 1 && entry.duration > slowTests.threshold)
      .sort(([, a], [, b]) => b.duration - a.duration)
      .slice(0, slowTests.max || Number.POSITIVE_INFINITY);

    slowFiles.forEach(([file, entry]) => {
      this.write(`  Slow test file: ${file} (${formatDuration(entry.duration)})`);
    });
    if (slowFiles.length) {
      this.write(`  Consider running tests from slow files in parallel. See: ${parallelDocsUrl}`);
    }
  }

  private write(line: string): void {
    process.stdout.write(`${line}\n`);
  }
}
