#!/usr/bin/env tsx

/**
 * Fails when a `tn-table` renders rows that carry no per-row `data-test`.
 *
 * Six accepted tickets in a row (NAS-141047, NAS-141484, NAS-142069, NAS-141791, NAS-141186,
 * NAS-143804) were the same defect: a migration replaced `<tbody ix-table-body>` — which tagged
 * every row from the column model's `uniqueRowTag` — with `<ng-template tnCellDef>` bodies that
 * emit nothing, and nobody noticed until a downstream suite broke. `e2e/CLAUDE.md` already binds
 * the *test author* to `[data-test]` selectors; nothing bound the PR that removed the attribute.
 * This does.
 *
 * The check is deliberately shallow — it reads templates as text, not as an Angular AST. It asks
 * only whether a table that renders row cells tags anything with the row's identity, which is the
 * mistake that actually happens; it cannot tell whether every *column* is tagged. A false negative
 * is the acceptable failure here and a false positive is not, so anything that plausibly carries a
 * row value into a test id counts — including an actions column, which is how most of the migrated
 * lists are addressable.
 */

import { readFileSync } from 'fs';
import { globSync } from 'glob';

/** A template renders row cells if it declares a cell body for a column. */
const rendersRowCells = /\btnCellDef\b/;

/** `<ng-template let-row tnCellDef>` — the name a cell body binds the row to. */
const rowVariables = /let-([A-Za-z_$][\w$]*)[^>]*?\btnCellDef\b/g;

/**
 * Evidence that does not depend on the row variable's name: a shared cell renderer (each takes a
 * `uniqueRowTag` input) or a row tag built on the component.
 */
const rowTagInTemplate = [
  /\buniqueRowTag\b/,
  /\browTag\s*\(/,
  /\bix-table-(text|actions|state|toggle|relative-date)-cell\b/,
];

function tagsRowsWithIdentity(contents: string): boolean {
  if (rowTagInTemplate.some((pattern) => pattern.test(contents))) {
    return true;
  }

  // Otherwise the row has to reach a test id by name: `[testId]="[row.id, 'delete']"`. Matched on
  // `row.`/`row)` rather than a bare word, so a static id that happens to contain "row" does not
  // pass the check by accident.
  const names = [...contents.matchAll(rowVariables)].map(([, name]) => name);
  return names.some((name) => new RegExp(
    `\\[(?:testId|tnTestId)\\]="[^"]*\\b${name}\\s*[.)][^"]*"`,
  ).test(contents));
}

function main(): void {
  const templates = globSync('src/app/**/*.html', { nodir: true })
    .sort((left, right) => left.localeCompare(right));
  const tableTemplates = templates.filter((file) => rendersRowCells.test(readFileSync(file, 'utf8')));
  const offenders = tableTemplates.filter((file) => !tagsRowsWithIdentity(readFileSync(file, 'utf8')));

  if (!offenders.length) {
    console.info(`✅ ${tableTemplates.length} tn-table templates checked; every one tags its rows.`);
    return;
  }

  console.error('❌ tn-table rows with no per-row test id:\n');
  for (const file of offenders) {
    console.error(`  ${file}`);
  }
  console.error(`
Each of these renders table cells (\`tnCellDef\`) without tagging them with the row's identity, so
an e2e test cannot address a row. Tag them — see \`memoizedRowTag\` /
\`tnTableListHost(...).rowTag\` in src/app/modules/tn-table/utils.ts and the
\`<ix-table-text-cell>\` renderer — rather than leaving a downstream suite to reach for a CSS or
text selector. See "Finding a \`data-test\` value" in e2e/CLAUDE.md.`);
  process.exitCode = 1;
}

main();
