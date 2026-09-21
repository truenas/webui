#!/usr/bin/env tsx

/**
 * Fails when something a test has to click carries no `data-test`.
 *
 * Six accepted tickets in a row (NAS-141047, NAS-141484, NAS-142069, NAS-141791, NAS-141186,
 * NAS-143804) were the same defect: a migration dropped a test id and nobody noticed until a
 * downstream suite broke. `e2e/CLAUDE.md` already binds the *test author* to `[data-test]`
 * selectors; nothing bound the PR that removed the attribute. This does.
 *
 * Five rules, all deliberately shallow — these read templates as text, not as an Angular AST:
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
 *    A handler is not the only way an element acts, so three more shapes count: a link that
 *    navigates (`href`/`routerLink` — the browser does the work, there is no handler to find), a
 *    native `<button>` with no handler of its own (a tooltip trigger, a form's submit), and a drag
 *    source or drop zone (`dnd*`, `cdkDrag*`, `mousedown`). Each was invisible while the rule
 *    asked only about clicks, which is how eleven external links, a tooltip trigger and six drag
 *    targets in the pool-manager layout ended up with no id.
 *    "Somewhere in its subtree" is the whole test, so an outer `<div (click)>` wrapping tagged
 *    children passes even though the wrapper itself is unaddressable — a green run means no
 *    clickable is *completely* unreachable, not that every click target has its own id.
 * 4. **Interactive library components.** Rule 3 is scoped to hyphen-free tags, so no `tn-*` tag was
 *    ever examined — and a library component writes an id only where the consumer passes one.
 *    Nothing derives it: `[testId]` unset, the id is simply absent (a *form control* falls back to
 *    its `formControlName`, so only a control bound anonymously through `[ngModel]` /
 *    `[formControl]` is at risk). That gap held a clickable `tn-banner`, five `tn-nested-tree-node`
 *    rows, five `tn-tab`s and an anonymous `tn-slide-toggle`, none of them reachable. Same subtree
 *    test as rule 3, and the same exemption map.
 *
 * 5. **Inert ids.** `tnTestId` is a directive, not an attribute Angular knows: write it in a
 *    template whose component does not import `TnTestIdDirective` and it emits *nothing at all*,
 *    silently — the same failure the retired directive left behind, and the one a template check
 *    cannot see because the attribute is right there in the markup. So every template that writes
 *    it must be declared by a component that imports the directive.
 *
 * What none of them see is a *changed* id: a renamed `testId` still resolves to something. That
 * stays a reviewer's job, as does whether a value matches what the column resolved pre-migration.
 *
 * A false negative is the acceptable failure here and a false positive is not, so anything that
 * plausibly resolves an id counts, and the handful of elements that are genuinely not automation
 * targets are listed in {@link allowedClickables} with the reason.
 *
 * `--report` prints per-column coverage and the count of unreadable value readouts instead of
 * gating, for tracking both numbers over time.
 */

import { readdirSync, readFileSync } from 'fs';
import { sep } from 'path';

const anyTestId = /\btestId\b|\btnTestId\b|data-test/;

/**
 * The directive this names was deleted in NAS-143893; the library's `[tnTestId]` is the only one
 * that writes a `data-test` now. An attribute by this name would therefore emit nothing at all —
 * a silently untagged element, the exact defect the rules above exist to catch. Matching the
 * prefix rather than the whole word is deliberate: no identifier starting with it survives.
 *
 * This and the `no-restricted-syntax` entry in `eslint.config.mjs` are the only two places the
 * retired name is written; a rule has to spell what it rejects.
 */
const retiredDirective = /\bixTest/g;

/**
 * Blanks out HTML comments, keeping every newline so reported line numbers still line up.
 *
 * Rule 3 used to tolerate matching inside a comment, because a false positive there needed a
 * `(click)` in the same span to be reported at all. That stopped being true once a bare `<button>`
 * became an offender on its own: two templates explain in prose what the `<button>` they replaced
 * used to render, and both were reported. So rule 3 reads the comment-stripped source too, as
 * {@link retiredDirective} already did — it has no second condition either, and a comment quoting
 * the retired name would otherwise read as a revived directive.
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
 * Text, not an AST — so the caller passes the comment-stripped source (see
 * {@link withoutComments}): prose describing markup is not markup.
 */
const clickableElements = /<([a-z][a-z0-9]*)((?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?)>/gs;
const clickHandler = /\((click|keydown[^)]*)\)/;

/**
 * Acting without a handler.
 *
 * `<a href>` / `<a routerLink>` navigates on its own, so there is no handler for `clickHandler` to
 * find — and a suite still has to click it. `<a>` with neither is a styled span, not a link.
 *
 * A native `<button>` may act through something other than a click binding (a tooltip it triggers
 * on focus, the submit of the form it sits in). `<input>` is deliberately NOT here: the bare
 * `<input>`s in this repo are library host elements — a `tnSliderThumb`, a control's inner input —
 * whose id is on the component wrapping them, which is an ancestor and so not in the subtree this
 * rule inspects. Those are rule 4's business.
 *
 * A drag source and a drop zone are both things a journey does, and neither needs a click.
 */
const navigates = /\brouterLink\b|\bhref\b/;
const dragOrPointerHandler = /\((dblclick|mousedown|mouseup|dragstart|dnd[A-Z]\w*|cdkDrag\w*)\)/;

function actsWithoutHandler(tag: string, attributes: string): boolean {
  return (tag === 'a' && navigates.test(attributes))
    || tag === 'button'
    || dragOrPointerHandler.test(attributes);
}

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
 * A library component is interactive when it declares a handler for something a person does to it.
 * `onClick` is `tn-button`'s output and `itemClick` is `tn-list-item`'s; the rest are shared.
 */
const componentClickHandler = new RegExp(
  '\\((click|keydown[^)]*|dblclick|mousedown|itemClick|onClick|selectedChange|selectionChange'
  + '|selectedIndexChange|toggle|dnd[A-Z]\\w*|cdkDrag\\w*)\\)',
);

/**
 * A declared control role. Rules 3 and 4 both treat it as an interactive signal: the two help
 * icons in the containers dialogs are `role="button"` with `tabindex="0"`, and their only handlers
 * cancel the key — the thing a suite reaches them for is the tooltip they raise on focus. Without
 * this they read as cancel-only and were skipped.
 */
const controlRole = /\brole="(button|link|option|menuitem|tab|switch|checkbox|radio)"/;
/**
 * Rule 4's wider form, which also counts a bare `tabindex`. That widening belongs to `tn-*` tags
 * only: there it is a consumer putting a library component into the tab order, while on a native
 * tag it is as often a non-control made keyboard-reachable — `tabindex="-1"` on the heading a
 * splash screen moves focus to, `tabindex="0"` on a `role="list"` that scrolls (WCAG 2.1.1).
 * Neither is something a suite clicks, so rule 3 asks for {@link controlRole} alone.
 */
const presentedAsControl = new RegExp(`${controlRole.source}|\\btabindex=`);

/**
 * Library form controls, which are the exception to "an unset `testId` means no id": each derives
 * one from the `formControlName` it is bound to. Only the anonymous bindings below leave a control
 * with nothing to derive from, and those are what this list is checked against.
 */
const libraryFormControls = new Set([
  'tn-input', 'tn-select', 'tn-checkbox', 'tn-checkbox-group', 'tn-radio-group', 'tn-slide-toggle',
  'tn-autocomplete', 'tn-chip-input', 'tn-button-toggle-group', 'tn-slider', 'tn-file-picker',
  'tn-file-input', 'tn-date-input', 'tn-date-range-input', 'tn-time-input',
]);
const anonymousValueBinding = /\[?\(?(ngModel|formControl|checked)\)?\]?\s*=/;
const derivesFromControlName = /\bformControlName\b/;

/** Every tag with a hyphen is a component: `tn-*` from the library, `ix-*` (and a few others) ours. */
const componentTags = /<([a-z][a-z0-9]*-[a-z0-9-]*)((?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?)>/gs;

/**
 * Our own components' templates, by selector, so this rule can ask whether a component resolves an
 * id *inside itself* — `<ix-job-item (click)>` carries no id at its call site and needs none,
 * because its own template tags six elements.
 *
 * Without this, checking `ix-*` at all would have been a false positive machine, and skipping it
 * left the hole that `ix-permissions-item` sat in: no id here, none inside, nothing to notice.
 * "Renders some id" is weak evidence — it does not prove the id is on the element that receives
 * the click — but it is exactly the standard rule 3 already applies to a subtree, and the strong
 * version needs an AST and a resolver this script deliberately does not have.
 *
 * A `tn-*` selector is absent from this map (the library lives in node_modules), so it resolves no
 * internal evidence and must be tagged at the call site. That is the intended asymmetry.
 */
interface ComponentScan {
  /**
   * Selector → the component's own template, for resolving an id across the component boundary.
   * Comment-stripped at the source, for the reason in {@link withoutComments}: a comment that
   * mentions `data-test` is not an id, and four templates in this repo have exactly that shape.
   */
  templateBySelector: Map<string, string>;
  /**
   * Template path → every `.ts` that declares it, for rule 5. A list rather than one file because
   * two components can share a template — `directory-chips.component.html` is declared by both
   * `ix-user-chips` and `ix-group-chips`, and `directory-autocomplete.component.html` by both
   * comboboxes. Keeping only the last one scanned made rule 5 depend on `readdirSync` order, and
   * in the passing case the *other* component rendered `tnTestId` inert with nothing reported —
   * the exact defect rule 5 exists to catch.
   */
  componentByTemplate: Map<string, string[]>;
  /** Template path → the selector that renders it, for the `--report` readout discount. */
  selectorByTemplate: Map<string, string>;
}

let scanned: ComponentScan | undefined;

/**
 * One walk of `src`, producing everything the rules need from our own components.
 *
 * Memoized because it is not cheap — every non-spec `.ts` plus every template they reference — and
 * three call sites wanted it: rule 4's cross-boundary lookup, rule 5's declaring component, and
 * the readout report's single-value components. It used to be three separate walks.
 */
function scanComponents(): ComponentScan {
  if (scanned) {
    return scanned;
  }
  const templateBySelector = new Map<string, string>();
  const componentByTemplate = new Map<string, string[]>();
  const selectorByTemplate = new Map<string, string>();
  const sources = readdirSync('src', { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.ts') && !entry.endsWith('.spec.ts'))
    .map((entry) => `src/${entry.split(sep).join('/')}`);

  for (const file of sources) {
    const src = readFileSync(file, 'utf8');
    const directory = file.slice(0, file.lastIndexOf('/'));

    for (const match of src.matchAll(/templateUrl:\s*'([^']+)'/g)) {
      const template = resolvePath(directory, match[1]);
      componentByTemplate.set(template, [...(componentByTemplate.get(template) ?? []), file]);
    }

    for (const decorator of decoratorBodies(src)) {
      const selector = /selector:\s*'([a-z][a-z0-9-]*)'/.exec(decorator)?.[1];
      if (!selector || templateBySelector.has(selector)) {
        continue;
      }
      const url = /templateUrl:\s*'([^']+)'/.exec(decorator);
      if (url) {
        const template = resolvePath(directory, url[1]);
        selectorByTemplate.set(template, selector);
        try {
          templateBySelector.set(selector, withoutComments(readFileSync(template, 'utf8')));
        } catch {
          templateBySelector.set(selector, '');
        }
        continue;
      }
      const inline = /template:\s*`([\s\S]*?)`/.exec(decorator);
      if (inline) {
        templateBySelector.set(selector, withoutComments(inline[1]));
      }
    }
  }

  scanned = { templateBySelector, componentByTemplate, selectorByTemplate };
  return scanned;
}

/**
 * The body of each `@Component({…})` in a file, cut at the class it decorates.
 *
 * The pairing used to read forward from the `selector:` match to the end of the file, which made
 * it depend on `selector` preceding `templateUrl` inside the decorator. That holds everywhere in
 * this repo today and nothing enforces it: a component written the other way round would drop out
 * of `templateBySelector` entirely, and rule 4 would then report its call sites rather than the
 * cause. Cutting at `class` — a decorator always sits immediately above the class it applies to —
 * scopes the search without needing to balance braces through an inline template.
 */
function decoratorBodies(src: string): string[] {
  return [...src.matchAll(/@Component\(\s*\{/g)].map((match) => {
    const body = src.slice(match.index);
    const end = body.search(/\n\s*(?:export\s+)?(?:abstract\s+)?class\s/);
    return end === -1 ? body : body.slice(0, end);
  });
}

/** Resolves a `templateUrl` against its component's directory, without pulling in `path`. */
function resolvePath(directory: string, relative: string): string {
  const resolved: string[] = [];
  for (const part of `${directory}/${relative}`.split('/')) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

/**
 * Id evidence for a component tag. Wider than {@link anyTestId} by the inputs whose names merely
 * *end* in `TestId` — `[rowTestId]` on a table, `[toggleTestId]` on a tree node,
 * `[closeButtonTestId]` on a side panel — each of which resolves an id for the element it names.
 */
const componentTestIdInput = /TestId\b/;

/**
 * Clickables that are deliberately unaddressable, as `<repo-relative path>:<class>`.
 *
 * Keyed on the full path, not the basename: `overlay` is a generic enough class name that a
 * basename key would silently wave through the next `<div class="overlay" (click)>` added to some
 * other file — the one failure mode this script is meant not to have. An entry that matches
 * nothing is reported too, so a class that gets renamed or deleted takes its exemption with it
 * instead of leaving a stale one behind.
 *
 * A component tag carries no class of its own to key on, so `<path>:<tag>` is accepted as well.
 * That is coarser — it exempts every tag of that name in the file, not one — so prefer a class.
 *
 * Only two shapes belong here: something that is not a target (a scrim closing what is above it,
 * a container listening for Escape), and something already addressable through an ancestor that
 * carries the id. Anything a journey would click belongs in the template with an id, not here —
 * and "the component has no `testId` input" is not a reason, because `[tnTestId]` is a directive
 * and applies to any host element. That is how the two `tn-list-item` rows are tagged.
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
    // A declared control role counts here for the same reason it counts in rule 4: a `<div
    // role="button" tabindex="0">` is a control to everyone who meets it, whether or not it
    // carries a handler this script can see. Without it the cancel-only escape hatch below waved
    // through exactly the shape rule 4 catches on a `tn-*` tag, purely because the tag was native.
    const acts = clickHandler.test(attributes)
      || actsWithoutHandler(match[1], attributes)
      || controlRole.test(attributes);
    if (!acts || anyTestId.test(attributes)) {
      continue;
    }
    const bodies = [...attributes.matchAll(handlerBodies)].map(([, body]) => body);
    const nonClickSignal = actsWithoutHandler(match[1], attributes) || controlRole.test(attributes);
    if (bodies.length && bodies.every(isCancelOnly) && !nonClickSignal) {
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

/**
 * Rule 4. Same shape as {@link untaggedClickables}, over `tn-*` tags instead of native ones, and
 * with a component's own id inputs counting as evidence.
 *
 * A control bound through `[formControlName]` is skipped before anything else: the library derives
 * its id from the control's name, so it is addressable with nothing in the template at all — which
 * is most of the form controls in this repo.
 *
 * Reads the comment-stripped source, for the reason in {@link withoutComments}: a comment
 * explaining a `(itemClick)` is not one.
 */
function untaggedComponents(
  file: string,
  src: string,
  ownTemplates: Map<string, string>,
): Offender[] {
  const offenders: Offender[] = [];

  for (const match of src.matchAll(componentTags)) {
    const [tag, attributes = ''] = [match[1], match[2]];
    const hasId = anyTestId.test(attributes) || componentTestIdInput.test(attributes);
    const isControl = libraryFormControls.has(tag);

    if (isControl && derivesFromControlName.test(attributes)) {
      continue;
    }
    const interactive = componentClickHandler.test(attributes)
      || presentedAsControl.test(attributes)
      || (isControl && anonymousValueBinding.test(attributes));
    if (!interactive || hasId) {
      continue;
    }
    // Cancel-only applies only when click/keydown is the *sole* interactive signal: `handlerBodies`
    // reads those two events, while `componentClickHandler` also matches `(itemClick)`, `(toggle)`,
    // `(dndStart)` and the rest. Without this guard a node carrying
    // `(click)="$event.stopPropagation()" (toggle)="onToggle()"` looked cancel-only and was skipped
    // while `(toggle)` was a real action.
    const bodies = [...attributes.matchAll(handlerBodies)].map(([, body]) => body);
    const nonClickSignal = componentClickHandler.test(attributes.replace(handlerBodies, ''))
      || presentedAsControl.test(attributes);
    if (bodies.length && bodies.every(isCancelOnly) && !nonClickSignal) {
      continue;
    }
    // Our own component: an id anywhere in its template makes it reachable, so the call site owes
    // nothing. A library tag is never in this map and so never satisfied this way.
    const own = ownTemplates.get(tag);
    if (own !== undefined && (anyTestId.test(own) || componentTestIdInput.test(own))) {
      continue;
    }
    // Same order as rule 3: an exemption is spent before the subtree is consulted, so the entry
    // retires with the element it names rather than with the element's descendants.
    const exemption = [...classNames(attributes), tag]
      .map((name) => `${file}:${name}`)
      .find((key) => allowedClickables.has(key));
    if (exemption) {
      usedExemptions.add(exemption);
      continue;
    }
    const block = outerBlock(src, tag, match.index, match.index + match[0].length);
    if (anyTestId.test(block) || componentTestIdInput.test(block)) {
      continue;
    }
    offenders.push({
      file,
      line: src.slice(0, match.index).split('\n').length,
      what: `<${tag}${isControl ? ' (bound with no formControlName)' : ''}>`,
    });
  }
  return offenders;
}

/**
 * Rule 5: a template writing `tnTestId` whose component never imported the directive.
 *
 * Keyed on `templateUrl`, which is how every component in this repo declares its markup; an inline
 * `template:` lives in the same file as its imports, so it cannot drift this way.
 */
function inertTestIds(templates: { file: string; src: string }[]): Offender[] {
  const { componentByTemplate } = scanComponents();

  return templates
    .filter(({ src }) => /\btnTestId\b/.test(withoutComments(src)))
    .flatMap(({ file, src }) => {
      // *Every* declaring component has to import it, not just one: the attribute is inert in
      // each component that does not, and the template cannot tell them apart.
      const components = componentByTemplate.get(file) ?? [];
      const missing = components.filter(
        (component) => !/\bTnTestIdDirective\b/.test(readFileSync(component, 'utf8')),
      );
      if (components.length && !missing.length) {
        return [];
      }
      const stripped = withoutComments(src);
      const at = stripped.search(/\btnTestId\b/);
      return [{
        file,
        line: stripped.slice(0, at).split('\n').length,
        what: missing.length
          ? `${missing.map((component) => component.split('/').pop()).join(', ')} `
          + 'does not import TnTestIdDirective'
          : 'no component declares this template',
      }];
    });
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
 * A value an e2e suite reads: a LEAF element whose own text renders an *interpolation*, since that
 * is what a suite asserts on — a status, a size, a count, a name. A translated literal
 * (`{{ 'Name' | translate }}`) is a label, not a value, and is not counted; anything reading data
 * is.
 *
 * Not a gate. A table column is one (rule 2) because the set is bounded and the id it owes is
 * knowable; a free-form readout is not — some are genuinely not automation targets (a gauge's
 * sublabel, prose inside a tooltip), and a rule that cannot tell those apart would either fail the
 * build for noise or need hundreds of exemptions. Measured here so the number is visible and can
 * be driven down per area, which is how the 117 untagged columns were closed.
 */
const leafValue = /<([a-z][a-z0-9-]*)((?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?)>([^<]*\{\{[^<]*)<\/\1>/gs;
const interpolations = /\{\{([^}]*)\}\}/g;

function readsData(text: string): boolean {
  return [...text.matchAll(interpolations)]
    .map(([, body]) => body.split('|')[0].trim())
    .some((head) => head.length > 0 && !/^'[^']*'$/.test(head) && !/^"[^"]*"$/.test(head));
}

const elementBoundaries = /<([a-z][a-z0-9-]*)((?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?)\/?>|<\/([a-z][a-z0-9-]*)>/gs;
/** Every HTML void element, so the first one added to a template does not sit on the stack. */
const selfClosingTags = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function valueCount(block: string): number {
  return [...block.matchAll(leafValue)].filter(([, , , text]) => readsData(text)).length;
}

/**
 * The markup enclosed by the nearest ancestor that carries an id, or null if none does.
 *
 * A readout needs no id of its own when such an ancestor holds *only* that value: a suite selects
 * the ancestor and reads its text, which is how `<ix-date>` works — its consumer tags the tag, and
 * the one value inside is what the element says.
 */
function taggedAncestorBlock(src: string, at: number): string | null {
  const open: { tag: string; attributes: string; start: number; openEnd: number }[] = [];
  for (const match of src.matchAll(elementBoundaries)) {
    if (match.index >= at) {
      break;
    }
    if (match[3]) {
      for (let i = open.length - 1; i >= 0; i -= 1) {
        if (open[i].tag === match[3]) {
          open.splice(i);
          break;
        }
      }
      continue;
    }
    // Read the slash off the matched text rather than capturing it: the attribute group accepts
    // `/`, so it swallows the slash of `<ix-foo … />` and a capture group there would be empty.
    // It matters — a self-closing tag left on the stack becomes a "nearest ancestor" with no
    // closing tag, whose block then runs to the end of the file.
    const selfClosing = match[0].endsWith('/>') || selfClosingTags.has(match[1]);
    if (!selfClosing) {
      open.push({
        tag: match[1],
        attributes: match[2] ?? '',
        start: match.index,
        openEnd: match.index + match[0].length,
      });
    }
  }
  for (let i = open.length - 1; i >= 0; i -= 1) {
    if (anyTestId.test(open[i].attributes)) {
      // `outerBlock` counts depth, so a nested element of the same name does not end the block
      // early — `indexOf('</div>')` used to cut `<div><div>label</div>{{ value }}</div>` at the
      // inner close, miss the value, and count the readout as unreachable.
      return outerBlock(src, open[i].tag, open[i].start, open[i].openEnd);
    }
  }
  return null;
}

/**
 * Readouts in this template that no suite can read, discounting the two ways one is already
 * addressable without an id of its own: a tagged ancestor holding just that value (above), and a
 * shared component whose whole template renders one value — every consumer tags the tag, so an id
 * inside would be both redundant and repeated on every instance in the page.
 */
function untaggedReadouts(src: string, isSingleValueComponent: boolean): number {
  if (isSingleValueComponent) {
    return 0;
  }
  const stripped = withoutComments(src);
  let count = 0;
  for (const match of stripped.matchAll(leafValue)) {
    const [, , attributes = '', text] = match;
    if (anyTestId.test(attributes) || !readsData(text)) {
      continue;
    }
    // A cell body is rule 2's business, and already fully covered.
    if (stripped.slice(Math.max(0, match.index - 400), match.index).includes('tnCellDef')) {
      continue;
    }
    const ancestor = taggedAncestorBlock(stripped, match.index);
    if (ancestor && valueCount(ancestor) === 1) {
      continue;
    }
    count += 1;
  }
  return count;
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

/** `--report`: untagged value readouts per area, the tracked-but-not-gated number. */
function reportReadoutCoverage(templates: { file: string; src: string }[]): void {
  // A template whose component renders exactly one value is addressed from its call sites.
  const { templateBySelector, selectorByTemplate } = scanComponents();
  const singleValue = new Set(
    [...templateBySelector]
      .filter(([, template]) => valueCount(template) === 1)
      .map(([selector]) => selector),
  );

  const perArea = new Map<string, number>();
  for (const { file, src } of templates) {
    // By path, from the same scan that resolved the `templateUrl`. Keying this on the template's
    // *contents* made two byte-identical templates collide, so the discount was applied for the
    // wrong selector — and it hashed every template in `src` in full to do it.
    const selector = selectorByTemplate.get(file);
    const count = untaggedReadouts(src, !!selector && singleValue.has(selector));
    if (!count) {
      continue;
    }
    const area = file.split('/').slice(0, 4).join('/');
    perArea.set(area, (perArea.get(area) ?? 0) + count);
  }

  const total = [...perArea.values()].reduce((sum, count) => sum + count, 0);
  console.info(
    `\n${total} value readouts are unreadable to a suite (no id of their own, and no tagged`
    + ' ancestor holding just that value), by area:',
  );
  for (const [area, count] of [...perArea].sort((left, right) => right[1] - left[1])) {
    console.info(`  ${String(count).padStart(4)}  ${area}`);
  }
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
    reportReadoutCoverage(templates);
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

  const clickables = templates.flatMap(
    ({ file, src }) => untaggedClickables(file, withoutComments(src)),
  );

  const ownTemplates = scanComponents().templateBySelector;
  const components = templates.flatMap(
    ({ file, src }) => untaggedComponents(file, withoutComments(src), ownTemplates),
  );

  const revivedDirective = templates.flatMap(({ file, src }) => [
    ...withoutComments(src).matchAll(retiredDirective),
  ].map(
    (match) => ({
      file,
      line: src.slice(0, match.index).split('\n').length,
      // eslint-disable-next-line no-restricted-syntax -- a rule has to spell what it rejects.
      what: 'ixTest',
    }),
  ));

  const inert = inertTestIds(templates);

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

  report('templates whose tnTestId emits nothing:', inert, `
\`tnTestId\` is a directive. Written in a template whose component does not import
\`TnTestIdDirective\`, it is an inert attribute: no \`data-test\`, no error, nothing — which is
exactly what the directive retired in NAS-143893 does now. Add \`TnTestIdDirective\` (from
\`@truenas/ui-components\`) to that component's \`imports\`.`);

  report('exemptions in allowedClickables that match nothing:', staleExemptions, `
Each of these names a clickable that no longer exists — the class was renamed, the element moved,
or it now carries an id of its own. Remove the entry from \`allowedClickables\` in this script, so
the exemption cannot outlive what it was written for.`);

  report('templates reviving the retired test-id directive:', revivedDirective, `
That directive was deleted in NAS-143893, so the attribute now writes no \`data-test\` at all. Use
the library's instead: \`tnTestIdType="<element type>"\` plus \`[tnTestId]="…"\` — and pre-normalize a
*dynamic* value with \`normalizeTestIdString\` / \`normalizeTestIdParts\`
(app/modules/test-id/normalize-test-id.utils.ts), which splits a letter→digit boundary the
library's kebab-casing leaves alone.`);

  report('interactive components with no test id:', components, `
Each of these is a component a test has to act on, with no id at the call site and none rendered
inside it either. A library component writes an id only where one is passed: an unset
\`[testId]\` is an absent attribute, not a derived one. Pass \`[testId]\` —
the bare semantic base, the element-type prefix is the library's — or, for a form control, bind it
with \`formControlName\` instead of \`[ngModel]\`/\`[formControl]\` and the id follows the control's
name. See "Finding a \`data-test\` value" in e2e/CLAUDE.md, and the coverage table in the library's
\`docs/test_ids.md\` for which input each component takes.`);

  report('action elements with no test id:', clickables, `
Each of these is acted on — a click, a navigation, a drag — and no \`[data-test]\` selector can
reach it. Add one —
\`tnTestIdType="button" [tnTestId]="'…'"\` on the element (or on the descendant that receives the
click) — or, if it is genuinely not an automation target, list it in \`allowedClickables\` in this
script with the reason. See "Finding a \`data-test\` value" in e2e/CLAUDE.md.`);

  if (!process.exitCode) {
    console.info(
      `✅ ${tables.length} tn-table templates tag their rows and every column; `
      + `${templates.length} templates carry no unaddressable action element, no untagged `
      + 'interactive component, no inert tnTestId and no retired directive.',
    );
  }
}

main();
