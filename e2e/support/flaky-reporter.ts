/**
 * Surfaces flaky tests (failed, then passed on the CI retry) where CI shows them: they leave the job green and
 * pass cleanly in `junit.xml`. Adds a GitHub Actions warning annotation per test via stdout workflow commands,
 * plus a job-summary table written to a file the `e2e-run` action appends to `GITHUB_STEP_SUMMARY`, since the
 * container can't see the runner's paths. That file lives outside the published `test-results/`.
 * CI only, and silent when nothing was flaky.
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
