/**
 * Puts the run's flaky tests where CI shows them, rather than only in the log.
 *
 * A test that fails and then passes on its CI retry leaves the job green and
 * is a clean pass in `junit.xml`; the `N flaky` tally near the end of a long
 * log (`list-reporter.ts`) was the only place it showed. This reporter adds,
 * for each one, a GitHub Actions warning annotation on the test's line, which
 * the run's page lists, and a table for the job summary.
 *
 * Annotations are workflow commands on stdout, which Actions reads from the
 * Playwright container's output as from any step's. The summary has to be a
 * file the runner appends to `GITHUB_STEP_SUMMARY` (the `e2e-run` action):
 * the container is not given the runner's own paths. It goes outside
 * `test-results/`, which is published.
 *
 * Only in CI, and silent when nothing was flaky.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import type { Reporter, Suite, TestCase } from '@playwright/test/reporter';

/** Read by the `e2e-run` action. */
export const flakySummaryFile = 'test-results-unpublished/flaky-summary.md';

/** Enough of the first failure to recognise it; the log has the rest. */
const maxErrorLength = 300;

/** Workflow command message escaping, per the Actions toolkit. */
function escapeData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

/** Workflow command property escaping: the message's, plus the separators. */
function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

function firstError(test: TestCase): string {
  const failed = test.results.find((result) => result.status !== 'passed' && result.status !== 'skipped');
  const message = failed?.error?.message ?? failed?.status ?? 'failed';
  const line = stripVTControlCharacters(message).split('\n').find((part) => part.trim()) ?? '';
  return line.length > maxErrorLength ? `${line.slice(0, maxErrorLength)}…` : line;
}

export default class FlakyReporter implements Reporter {
  private suite?: Suite;

  onBegin(_config: unknown, suite: Suite): void {
    this.suite = suite;
    rmSync(flakySummaryFile, { force: true });
  }

  onEnd(): void {
    if (!process.env.CI || !this.suite) {
      return;
    }
    const flaky = this.suite.allTests().filter((test) => test.outcome() === 'flaky');
    if (!flaky.length) {
      return;
    }

    const rows = flaky.map((test) => {
      const file = relative(process.cwd(), test.location.file);
      const title = test.titlePath().slice(3).join(' › ') || test.title;
      const error = firstError(test);
      const message = escapeData(`${title} — failed, then passed on retry: ${error}`);
      const properties = `file=${escapeProperty(file)},line=${test.location.line},title=Flaky test`;
      process.stdout.write(`::warning ${properties}::${message}\n`);
      const cell = (value: string): string => value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
      return `| \`${cell(file)}:${test.location.line}\` | ${cell(title)} | ${cell(error)} |`;
    });

    mkdirSync(dirname(flakySummaryFile), { recursive: true });
    writeFileSync(flakySummaryFile, [
      `### ⚠️ ${flaky.length} flaky test${flaky.length === 1 ? '' : 's'}`,
      '',
      'Failed, then passed on retry. The job stays green; these are worth a look.',
      '',
      '| Test | Title | First failure |',
      '|---|---|---|',
      ...rows,
      '',
    ].join('\n'));
  }

  printsToStdio(): boolean {
    return false;
  }
}
