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
 *    `tn-table` writes nothing on the row of its own, so a cell body that is bare interpolation
 *    leaves the row unaddressable. Asks whether something that renders INSIDE the row — a cell
 *    body, a row action, or `[rowTestId]` on the table — carries the row's identity. It cannot
 *    tell whether every column is tagged, which stays a reviewer's job.
 * 2. **Clickables.** A plain element carrying a `(click)`/`(keydown)` handler is something a test
 *    has to click, so it needs an id on itself or on a descendant that receives the click.
 *    "Somewhere in its subtree" is the whole test, so an outer `<div (click)>` wrapping tagged
 *    children passes even though the wrapper itself is unaddressable — a green run means no
 *    clickable is *completely* unreachable, not that every click target has its own id.
 *
 * A false negative is the acceptable failure here and a false positive is not, so anything that
 * plausibly resolves an id counts, and the handful of elements that are genuinely not automation
 * targets are listed in {@link allowedClickables} with the reason.
 */

import { readdirSync, readFileSync } from 'fs';
import { sep } from 'path';

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

/** A row variable may contain `$`, which is an anchor rather than a literal inside a pattern. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The parts of a template that render INSIDE the `<tr>`: each column's cell body and the row
 * actions. Deliberately not the whole file — a tag in the detail row satisfied the rule while
 * leaving the row itself unaddressable, and a detail row can only be opened by first clicking a
 * row a test cannot select. Each column is cut at its own `</ng-container>` so the last one does
 * not run on into whatever follows the column list.
 */
function rowContents(contents: string): string[] {
  const parts = contents.split(/(?=tnColumnDef)/).slice(1).map((chunk) => {
    const end = chunk.indexOf('</ng-container>');
    const column = end === -1 ? chunk : chunk.slice(0, end);
    // From the `<ng-template>` that opens the cell body, so its `let-row` is still in the region.
    const cell = column.indexOf('tnCellDef');
    return cell === -1 ? '' : column.slice(column.lastIndexOf('<ng-template', cell));
  });

  const actions = contents.indexOf('tnRowActionsDef');
  if (actions !== -1) {
    const rest = contents.slice(contents.lastIndexOf('<ng-template', actions));
    const end = rest.indexOf('</ng-template>');
    parts.push(end === -1 ? rest : rest.slice(0, end));
  }

  return parts.filter(Boolean);
}

function tagsRowsWithIdentity(contents: string): boolean {
  // The whole row at once: `[rowTestId]` puts the tag on the `<tr>` itself, which is the one id
  // that survives a column being dropped.
  if (contents.includes('[rowTestId]')) {
    return true;
  }

  return rowContents(contents).some((region) => {
    if (rowTagInTemplate.some((pattern) => pattern.test(region))) {
      return true;
    }

    // Otherwise the row has to reach a test id by name: `[testId]="[row.id, 'delete']"`. Matched
    // on `row.`/`row)` rather than a bare word, so a static id that happens to contain "row" does
    // not pass by accident. `(?<![\w$])` rather than `\b` for that boundary, because a name may
    // legally start or end with `$` — `\b` sits between two word characters, so it never matches
    // beside one, and `let-row$` would compile a pattern that can only fail.
    const names = [...region.matchAll(rowVariables)].map(([, name]) => name);
    return names.some((name) => new RegExp(
      `\\[(?:testId|tnTestId)\\]="[^"]*(?<![\\w$])${escapeRegExp(name)}\\s*[.)][^"]*"`,
    ).test(region));
  });
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

function main(): void {
  const templates = readdirSync('src/app', { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.html'))
    .map((entry) => `src/app/${entry.split(sep).join('/')}`)
    .sort((left, right) => left.localeCompare(right))
    .map((file) => ({ file, src: readFileSync(file, 'utf8') }));

  const tables = templates.filter(({ src }) => rendersRowCells.test(src));
  const untaggedRows = tables
    .filter(({ src }) => !tagsRowsWithIdentity(src))
    .map(({ file }) => ({ file, line: 1, what: 'tn-table rows carry no test id' }));

  const clickables = templates.flatMap(({ file, src }) => untaggedClickables(file, src));

  const staleExemptions = [...allowedClickables.keys()]
    .filter((key) => !usedExemptions.has(key))
    .map((key) => ({ file: key.split(':')[0], line: 1, what: `no clickable matches "${key}"` }));

  report('tn-table rows with no per-row test id:', untaggedRows, `
Each of these renders table cells (\`tnCellDef\`) with nothing inside the row carrying the row's
identity, so an e2e test cannot address a row. A tag in the DETAIL row does not count: it is only
reachable by first clicking a row that cannot be selected. Bind \`[rowTestId]\` on the table, or tag
the cells — see \`memoizedRowTag\` /
\`tnTableListHost(...).rowTag\` in src/app/modules/tn-table/utils.ts and the
\`<ix-table-text-cell>\` renderer — rather than leaving a downstream suite to reach for a CSS or
text selector. See "Addressing a table row" in e2e/CLAUDE.md.`);

  report('exemptions in allowedClickables that match nothing:', staleExemptions, `
Each of these names a clickable that no longer exists — the class was renamed, the element moved,
or it now carries an id of its own. Remove the entry from \`allowedClickables\` in this script, so
the exemption cannot outlive what it was written for.`);

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
