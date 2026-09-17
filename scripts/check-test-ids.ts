#!/usr/bin/env tsx

/**
 * Fails when something a test has to click carries no `data-test`.
 *
 * Six accepted tickets in a row (NAS-141047, NAS-141484, NAS-142069, NAS-141791, NAS-141186,
 * NAS-143804) were the same defect: a migration dropped a test id and nobody noticed until a
 * downstream suite broke. `e2e/CLAUDE.md` already binds the *test author* to `[data-test]`
 * selectors; nothing bound the PR that removed the attribute. This does.
 *
 * Two rules, both deliberately shallow — these read templates as text, not as an Angular AST:
 *
 * 1. **Table rows.** `ix-table-body` tagged every `<tr>` from the column model's `uniqueRowTag`;
 *    `tn-table` writes nothing on the row, so a cell body that is bare interpolation leaves the
 *    row unaddressable. Asks only whether a table that renders cells tags *anything* with the
 *    row's identity — it cannot tell whether every column is tagged.
 * 2. **Clickables.** A plain element carrying a `(click)`/`(keydown)` handler is something a test
 *    has to click, so it needs an id on itself or on a descendant that receives the click.
 *
 * A false negative is the acceptable failure here and a false positive is not, so anything that
 * plausibly resolves an id counts, and the handful of elements that are genuinely not automation
 * targets are listed in {@link allowedClickables} with the reason.
 */

import { readFileSync } from 'fs';
import { globSync } from 'glob';

const anyTestId = /\btestId\b|\btnTestId\b|\bixTest\b|data-test/;

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

/**
 * Plain elements, i.e. every native tag. A component selector always contains a hyphen
 * (`tn-button`, `ix-icon`, `ng-container`), so "no hyphen" is the whole rule — an allowlist of
 * native tags would silently exempt the next `<pre (click)>` or `<nav (click)>` that shows up.
 */
const clickableElements = /<([a-z][a-z0-9]*)(\s[^>]*?)?>/gs;
const clickHandler = /\((click|keydown[^)]*)\)/;

/**
 * A handler that only cancels the event (`(keydown.enter)="$event.preventDefault()"` on a form,
 * to stop Enter from submitting it) is a guard, not something a test clicks.
 */
const handlerBodies = /\((?:click|keydown[^)]*)\)="([^"]*)"/g;
const cancelOnly = /^(?:\s*\$event\.(?:preventDefault|stopPropagation)\(\)\s*;?)+$/;

/**
 * Clickables that are deliberately unaddressable, as `<file>:<class>`.
 *
 * Only two shapes belong here: something that is not a target (a scrim closing what is above it,
 * a container listening for Escape), and something already addressable through an ancestor that
 * carries the id. Anything a journey would click belongs in the template with an id, not here.
 */
const allowedClickables = new Map<string, string>([
  ['admin-layout.component.html:overlay', 'Scrim behind the secondary menu; a test closes the menu by clicking what opened it.'],
  ['admin-layout.component.html:alert-panel-backdrop', 'Scrim behind the alerts panel, aria-hidden.'],
  ['admin-layout.component.html:alert-panel-container', 'Panel container; listens for Escape. Its contents carry their own ids.'],
  ['dataset-management.component.html:dataset-node-click', 'Inside <tn-tree-node [testId]="[\'dataset\', name]">, which is what a click on the row resolves to.'],
]);

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

/**
 * The element's own markup plus everything it contains, so an id on the child that actually
 * receives the click (a `<li>` wrapping the `<a>` that navigates) counts for the element.
 */
function outerBlock(src: string, tag: string, start: number, openTagEnd: number): string {
  if (src[openTagEnd - 2] === '/') {
    return src.slice(start, openTagEnd);
  }
  const open = new RegExp(`<${tag}(\\s|>)`, 'g');
  const close = new RegExp(`</${tag}>`, 'g');
  let depth = 1;
  let index = openTagEnd;
  while (index < src.length && depth > 0) {
    open.lastIndex = index;
    close.lastIndex = index;
    const nextOpen = open.exec(src);
    const nextClose = close.exec(src);
    if (!nextClose) {
      break;
    }
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      index = nextOpen.index + 1;
    } else {
      depth--;
      index = nextClose.index + `</${tag}>`.length;
    }
  }
  return src.slice(start, index);
}

function classNames(attributes: string): string[] {
  return [...attributes.matchAll(/\bclass="([^"]*)"/g)]
    .flatMap(([, value]) => value.split(/\s+/))
    .filter(Boolean);
}

interface Offender { file: string; line: number; what: string }

function untaggedClickables(file: string, src: string): Offender[] {
  const offenders: Offender[] = [];
  const basename = file.split('/').pop() as string;

  for (const match of src.matchAll(clickableElements)) {
    const attributes = match[2] ?? '';
    if (!clickHandler.test(attributes) || anyTestId.test(attributes)) {
      continue;
    }
    const bodies = [...attributes.matchAll(handlerBodies)].map(([, body]) => body);
    if (bodies.length && bodies.every((body) => cancelOnly.test(body))) {
      continue;
    }
    if (anyTestId.test(outerBlock(src, match[1], match.index, match.index + match[0].length))) {
      continue;
    }
    if (classNames(attributes).some((name) => allowedClickables.has(`${basename}:${name}`))) {
      continue;
    }
    offenders.push({
      file,
      line: src.slice(0, match.index).split('\n').length,
      what: `<${match[1]} class="${classNames(attributes).join(' ')}">`,
    });
  }
  return offenders;
}

function report(title: string, offenders: Offender[], advice: string): void {
  if (!offenders.length) {
    return;
  }
  console.error(`\n❌ ${title}\n`);
  for (const { file, line, what } of offenders) {
    console.error(`  ${file}:${line}  ${what}`);
  }
  console.error(advice);
  process.exitCode = 1;
}

function main(): void {
  const templates = globSync('src/app/**/*.html', { nodir: true })
    .sort((left, right) => left.localeCompare(right))
    .map((file) => ({ file, src: readFileSync(file, 'utf8') }));

  const tables = templates.filter(({ src }) => rendersRowCells.test(src));
  const untaggedRows = tables
    .filter(({ src }) => !tagsRowsWithIdentity(src))
    .map(({ file }) => ({ file, line: 1, what: 'tn-table rows carry no test id' }));

  const clickables = templates.flatMap(({ file, src }) => untaggedClickables(file, src));

  report('tn-table rows with no per-row test id:', untaggedRows, `
Each of these renders table cells (\`tnCellDef\`) without tagging them with the row's identity, so
an e2e test cannot address a row. Tag them — see \`memoizedRowTag\` /
\`tnTableListHost(...).rowTag\` in src/app/modules/tn-table/utils.ts and the
\`<ix-table-text-cell>\` renderer — rather than leaving a downstream suite to reach for a CSS or
text selector. See "Addressing a table row" in e2e/CLAUDE.md.`);

  report('clickable elements with no test id:', clickables, `
Each of these handles a click that no \`[data-test]\` selector can reach. Add one —
\`tnTestIdType="button" [tnTestId]="'…'"\` on the element (or on the descendant that receives the
click) — or, if it is genuinely not an automation target, list it in \`allowedClickables\` in this
script with the reason. See "Finding a \`data-test\` value" in e2e/CLAUDE.md.`);

  if (!process.exitCode) {
    console.info(
      `✅ ${tables.length} tn-table templates tag their rows; `
      + `${templates.length} templates carry no unaddressable clickable.`,
    );
  }
}

main();
