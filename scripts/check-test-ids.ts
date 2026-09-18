#!/usr/bin/env tsx

/**
 * Fails when something a test has to click carries no `data-test`.
 *
 * Six accepted tickets in a row (NAS-141047, NAS-141484, NAS-142069, NAS-141791, NAS-141186,
 * NAS-143804) were the same defect: a migration dropped a test id and nobody noticed until a
 * downstream suite broke. `e2e/CLAUDE.md` already binds the *test author* to `[data-test]`
 * selectors; nothing bound the PR that removed the attribute. This does.
 *
 * Three rules, all deliberately shallow — these read templates as text, not as an Angular AST:
 *
 * 1. **Table rows.** `ix-table-body` tagged every `<tr>` from the column model's `uniqueRowTag`;
 *    `tn-table` writes nothing on the row of its own, so a migrated list lost that id. Every list
 *    now binds `[rowTestId]`, which puts it back, and this asks for exactly that — not for "some
 *    element in the row is tagged", because a tag on a cell or an action button leaves with the
 *    column or button it sits on, while the row's own id is what a suite selects a row by.
 * 2. **Table columns.** A column whose cell body renders no id is a value no suite can read: the
 *    row is addressable, that column of it is not, and `e2e/CLAUDE.md` allows no CSS or text
 *    selector to reach the cell. Asks that each `tnCellDef` body resolve an id somewhere.
 * 3. **Clickables.** A plain element carrying a `(click)`/`(keydown)` handler is something a test
 *    has to click, so it needs an id on itself or on a descendant that receives the click.
 *    "Somewhere in its subtree" is the whole test, so an outer `<div (click)>` wrapping tagged
 *    children passes even though the wrapper itself is unaddressable — a green run means no
 *    clickable is *completely* unreachable, not that every click target has its own id.
 *
 * What none of them see is a *changed* id: a renamed `testId` still resolves to something. That
 * stays a reviewer's job, as does whether a value matches what the column resolved pre-migration.
 *
 * A false negative is the acceptable failure here and a false positive is not, so anything that
 * plausibly resolves an id counts, and the handful of elements that are genuinely not automation
 * targets are listed in {@link allowedClickables} with the reason.
 *
 * `--report` prints per-column coverage instead of gating, for tracking the number over time.
 */

import { readdirSync, readFileSync } from 'fs';
import { sep } from 'path';

const anyTestId = /\btestId\b|\btnTestId\b|data-test/;

/**
 * `[ixTest]` is gone (NAS-143893): the one directive that writes a `data-test` is the library's
 * `[tnTestId]`. The local `TestDirective` is deleted, so an `ixTest` attribute would now emit
 * nothing at all — a silently untagged element, which is the exact defect the rules above exist
 * to catch. Nothing named `ixTest*` survives, so this matches the prefix rather than the exact
 * word: `ixTestOverride`, the last holdout, is now `<ix-table-pager-show-more>`'s `[testId]`.
 */
const retiredIxTest = /\bixTest/g;

/**
 * Blanks out HTML comments, keeping every newline so reported line numbers still line up.
 *
 * The rules above read templates as text and tolerate matching inside a comment, because a false
 * positive there needs a `(click)` in the same span to be reported at all. {@link retiredIxTest} has
 * no such second condition, and several templates carry a comment saying what the legacy `[ixTest]`
 * on that element resolved to — notes worth keeping, and not a revived directive.
 */
function withoutComments(src: string): string {
  return src.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '));
}

/** A template renders row cells if it declares a cell body for a column. */
const rendersRowCells = /\btnCellDef\b/;

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
 *
 * Quoted attribute values are consumed whole, so a `>` inside a binding — `[class.wide]="n > 3"`,
 * a `@if` guard — does not end the tag. Stopping at the first bare `>` skipped the element
 * entirely: everything after that binding, `(click)` included, fell outside the captured
 * attributes, and `matchAll` resumed past it, so no later match saw the handler either. That is a
 * false NEGATIVE, the direction this script cannot afford.
 *
 * Text, not an AST: this still matches inside an HTML comment, which would need a `(click)` in the
 * same span to be reported — a confusing false positive, which is the affordable direction.
 */
const clickableElements = /<([a-z][a-z0-9]*)((?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?)>/gs;
const clickHandler = /\((click|keydown[^)]*)\)/;

/**
 * A handler that only cancels the event (`(keydown.enter)="$event.preventDefault()"` on a form,
 * to stop Enter from submitting it) is a guard, not something a test clicks.
 *
 * Split on `;` and match each statement whole, rather than matching the sequence with one
 * quantified pattern — a `(…)+` around an expression that can also match the empty string
 * backtracks exponentially on a body that nearly matches.
 */
const handlerBodies = /\((?:click|keydown[^)]*)\)="([^"]*)"/g;
const cancelCall = /^\$event\.(?:preventDefault|stopPropagation)\(\)$/;

function isCancelOnly(body: string): boolean {
  const statements = body.split(';').map((statement) => statement.trim()).filter(Boolean);
  return statements.length > 0 && statements.every((statement) => cancelCall.test(statement));
}

/**
 * Clickables that are deliberately unaddressable, as `<repo-relative path>:<class>`.
 *
 * Keyed on the full path, not the basename: `overlay` is a generic enough class name that a
 * basename key would silently wave through the next `<div class="overlay" (click)>` added to some
 * other file — the one failure mode this script is meant not to have. An entry that matches
 * nothing is reported too, so a class that gets renamed or deleted takes its exemption with it
 * instead of leaving a stale one behind.
 *
 * Only two shapes belong here: something that is not a target (a scrim closing what is above it,
 * a container listening for Escape), and something already addressable through an ancestor that
 * carries the id. Anything a journey would click belongs in the template with an id, not here.
 */
const allowedClickables = new Map<string, string>([
  ['src/app/modules/layout/admin-layout/admin-layout.component.html:overlay', 'Scrim behind the secondary menu; a test closes the menu by clicking what opened it.'],
  ['src/app/modules/layout/admin-layout/admin-layout.component.html:alert-panel-backdrop', 'Scrim behind the alerts panel, aria-hidden.'],
  ['src/app/modules/layout/admin-layout/admin-layout.component.html:alert-panel-container', 'Panel container; listens for Escape. Its contents carry their own ids.'],
  ['src/app/pages/datasets/components/dataset-management/dataset-management.component.html:dataset-node-click', 'Inside <tn-tree-node [testId]="[\'dataset\', name]">, which is what a click on the row resolves to.'],
]);

/** Entries of {@link allowedClickables} that exempted an element this run. */
const usedExemptions = new Set<string>();

/**
 * The parts of a template that render INSIDE the `<tr>`: each column's cell body and the row
 * actions. Deliberately not the whole file — a tag in the detail row satisfied the rule while
 * leaving the row itself unaddressable, and a detail row can only be opened by first clicking a
 * row a test cannot select. Each column is cut at its own `</ng-container>` so the last one does
 * not run on into whatever follows the column list.
 */
/** One column of a table template: its name and the markup of its cell body. */
interface Column { name: string; body: string }

/** The columns a template declares, each cut at its own `</ng-container>`. */
function columnsOf(contents: string): Column[] {
  return contents.split(/(?=tnColumnDef)/).slice(1).flatMap((chunk) => {
    const end = chunk.indexOf('</ng-container>');
    const column = end === -1 ? chunk : chunk.slice(0, end);
    const cell = column.indexOf('tnCellDef');
    if (cell === -1) {
      return [];
    }
    const name = /tnColumnDef\]?="?'?([\w_.-]+)/.exec(column);
    return [{
      name: name?.[1] ?? '?',
      body: column.slice(column.lastIndexOf('<ng-template', cell)),
    }];
  });
}

/** Whether a cell body renders anything an automated suite could select. */
function cellIsTagged(body: string): boolean {
  return anyTestId.test(body) || rowTagInTemplate.some((pattern) => pattern.test(body));
}

/**
 * The row's own id. Every list binds `[rowTestId]`, so this asks for exactly that rather than for
 * "something in the row is tagged": a tag on a cell or an action button is an id for that element,
 * and it disappears with the column or the button it sits on, while the `<tr>`'s own id is what a
 * suite selects a row by. One line on the table, from the same `uniqueRowTag` the cells use.
 */
function tagsRowsWithIdentity(contents: string): boolean {
  return contents.includes('[rowTestId]');
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

  for (const match of src.matchAll(clickableElements)) {
    const attributes = match[2] ?? '';
    if (!clickHandler.test(attributes) || anyTestId.test(attributes)) {
      continue;
    }
    const bodies = [...attributes.matchAll(handlerBodies)].map(([, body]) => body);
    if (bodies.length && bodies.every(isCancelOnly)) {
      continue;
    }
    // Before the subtree check, so that an exemption counts as used whenever the element it names
    // is still there. Testing the subtree first would retire the entry the moment the element
    // gained a tagged descendant, and the run would fail saying the class matches nothing.
    const exemption = classNames(attributes)
      .map((name) => `${file}:${name}`)
      .find((key) => allowedClickables.has(key));
    if (exemption) {
      usedExemptions.add(exemption);
      continue;
    }
    if (anyTestId.test(outerBlock(src, match[1], match.index, match.index + match[0].length))) {
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

/**
 * `--report`: per-column coverage, which the rules themselves do not enforce.
 *
 * Rule 1 asks whether a row is addressable, not whether every column is — that stays a reviewer's
 * job, and the number is worth watching rather than guessing. Prints and exits 0: this is a
 * measurement, not a gate, so it can be run on a branch that is mid-way through fixing it.
 */
function reportColumnCoverage(tables: { file: string; src: string }[]): void {
  const perTable = tables.map(({ file, src }) => {
    const columns = columnsOf(src);
    return {
      file,
      columns: columns.length,
      untagged: columns.filter(({ body }) => !cellIsTagged(body)).map(({ name }) => name),
      taggedRow: src.includes('[rowTestId]'),
    };
  });

  const columns = perTable.reduce((sum, table) => sum + table.columns, 0);
  const untagged = perTable.reduce((sum, table) => sum + table.untagged.length, 0);

  for (const table of perTable.filter((entry) => entry.untagged.length).sort(
    (left, right) => right.untagged.length - left.untagged.length,
  )) {
    console.info(`  ${String(table.untagged.length).padStart(2)}/${table.columns}  ${table.file}`);
    console.info(`        ${table.untagged.join(', ')}`);
  }

  console.info(
    `\n${tables.length} tn-table templates, ${columns} columns with a cell body.`
    + `\n${untagged} carry no test id (${Math.round((untagged / columns) * 100)}%), `
    + `in ${perTable.filter((entry) => entry.untagged.length).length} templates.`
    + `\n${perTable.filter((entry) => entry.taggedRow).length} bind [rowTestId].`,
  );
}

function main(): void {
  const templates = readdirSync('src/app', { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.html'))
    .map((entry) => `src/app/${entry.split(sep).join('/')}`)
    .sort((left, right) => left.localeCompare(right))
    .map((file) => ({ file, src: readFileSync(file, 'utf8') }));

  const tables = templates.filter(({ src }) => rendersRowCells.test(src));

  if (process.argv.includes('--report')) {
    reportColumnCoverage(tables);
    return;
  }
  const untaggedRows = tables
    .filter(({ src }) => !tagsRowsWithIdentity(src))
    .map(({ file }) => ({ file, line: 1, what: 'table does not bind [rowTestId]' }));

  const untaggedColumns = tables.flatMap(({ file, src }) => columnsOf(src)
    .filter(({ body }) => !cellIsTagged(body))
    .map(({ name }) => ({
      file,
      line: src.slice(0, src.indexOf(`tnColumnDef]="'${name}'`)).split('\n').length,
      what: `column "${name}" renders a cell with no test id`,
    })));

  const clickables = templates.flatMap(({ file, src }) => untaggedClickables(file, src));

  const revivedIxTest = templates.flatMap(({ file, src }) => [...withoutComments(src).matchAll(retiredIxTest)].map(
    (match) => ({
      file,
      line: src.slice(0, match.index).split('\n').length,
      // eslint-disable-next-line no-restricted-syntax -- the rule this script is, naming what it bans.
      what: 'ixTest',
    }),
  ));

  const staleExemptions = [...allowedClickables.keys()]
    .filter((key) => !usedExemptions.has(key))
    .map((key) => ({ file: key.split(':')[0], line: 1, what: `no clickable matches "${key}"` }));

  report('tn-table lists that do not bind [rowTestId]:', untaggedRows, `
Each of these renders table cells (\`tnCellDef\`) without naming the row itself, so an e2e test has
to reach a row through one of its cells — which disappears with the column. Bind
\`[rowTestId]="uniqueRowTag"\` on the table, from the same row tag the cells pass (a bound property,
not a method: the table takes the function itself). See \`memoizedRowTag\` and
\`tnTableListHost(...).rowTag\` in src/app/modules/tn-table/utils.ts, and "Addressing a table row"
in e2e/CLAUDE.md.`);

  report('table columns with no test id:', untaggedColumns, `
Each of these renders a value an e2e test cannot read: the row is addressable, but this column of
it is not, and the suite is not allowed a CSS or text selector to reach the cell (\`[data-column]\`
included). Render plain text through \`<ix-table-text-cell>\`, or put
\`tnTestIdType\` + \`[tnTestId]="[title, <rowTag>(row), '<suffix>']"\` on whatever element holds the
value. The suffix names the kind of cell — \`row-text\`, \`row-yesno\`, \`row-size\`, \`row-date\`,
\`row-relative-date\`, \`row-state\`, \`row-schedule\` — and matches what the column resolved before
the tn-table migration. See "Addressing a table row" in e2e/CLAUDE.md.`);

  report('exemptions in allowedClickables that match nothing:', staleExemptions, `
Each of these names a clickable that no longer exists — the class was renamed, the element moved,
or it now carries an id of its own. Remove the entry from \`allowedClickables\` in this script, so
the exemption cannot outlive what it was written for.`);

  report('templates using the retired ixTest directive:', revivedIxTest, `
\`[ixTest]\` and its \`TestDirective\` were deleted in NAS-143893, so this attribute now writes no
\`data-test\` at all. Use the library's directive instead: \`tnTestIdType="<element type>"\` plus
\`[tnTestId]="…"\` — and pre-normalize a *dynamic* value with \`normalizeTestIdString\` /
\`normalizeTestIdParts\` (app/modules/test-id/normalize-test-id.utils.ts), which splits a
letter→digit boundary the library's kebab-casing leaves alone.`);

  report('clickable elements with no test id:', clickables, `
Each of these handles a click that no \`[data-test]\` selector can reach. Add one —
\`tnTestIdType="button" [tnTestId]="'…'"\` on the element (or on the descendant that receives the
click) — or, if it is genuinely not an automation target, list it in \`allowedClickables\` in this
script with the reason. See "Finding a \`data-test\` value" in e2e/CLAUDE.md.`);

  if (!process.exitCode) {
    console.info(
      `✅ ${tables.length} tn-table templates tag their rows and every column; `
      + `${templates.length} templates carry no unaddressable clickable and no revived ixTest.`,
    );
  }
}

main();
