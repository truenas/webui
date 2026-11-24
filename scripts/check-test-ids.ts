#!/usr/bin/env tsx

/**
 * Fails when something a test has to click or read carries no `data-test`, since migrations kept dropping ids
 * unnoticed. Six shallow, text-based rules: table rows bind `[rowTestId]`; each `tnCellDef` resolves an id;
 * clickables, links, buttons and drag targets have an id in their subtree; interactive `tn-*` components get
 * one; templates using `tnTestId` import `TnTestIdDirective`; value readouts are addressable. A false negative
 * is acceptable and a false positive is not; exemptions live in {@link allowedClickables} and
 * {@link allowedReadouts}. Renamed ids aren't caught. `--report [path]` prints coverage instead of gating.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
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
 * Blanks out HTML comments, keeping newlines so line numbers still line up. Rule 3 needs it since a bare
 * `<button>` became an offender on its own: prose describing old markup was reported.
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
 * Native elements: component selectors always contain a hyphen, so "no hyphen" is the rule; an allowlist of
 * native tags would miss the next `<pre (click)>`. Quoted attribute values are consumed whole so a `>` inside
 * a binding doesn't end the tag, which would hide the handler (a false negative). Callers pass
 * comment-stripped source (see {@link withoutComments}).
 */
const clickableElements = /<([a-z][a-z0-9]*)((?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?)>/gs;
const clickHandler = /\((click|keydown[^)]*)\)/;

/**
 * Elements that act without a click handler: `<a href>` / `<a routerLink>` (an `<a>` with neither is a styled
 * span), a native `<button>` (tooltip trigger, form submit), and drag sources and drop zones. `<input>` is left
 * to rule 4, since bare inputs here are library hosts whose id is on the wrapping component.
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
 * Our own components' templates by selector, so a component that tags elements inside itself needs no id at
 * its call site (`<ix-job-item (click)>`). "Renders some id" is the same weak evidence rule 3 applies to a
 * subtree; the strong version needs an AST. `tn-*` selectors aren't here (the library is in node_modules), so
 * they must be tagged at the call site, by design.
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
 * The body of each `@Component({…})` in a file, cut at the class it decorates, so pairing doesn't depend on
 * `selector` preceding `templateUrl` and no brace balancing through an inline template is needed.
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
 * Deliberately unaddressable clickables, as `<repo-relative path>:<class>` (or `<path>:<tag>`, which exempts
 * every such tag in the file, so prefer a class). Full paths so a generic class can't exempt other files; an
 * entry matching nothing is reported, so exemptions die with their element. Only non-targets (a scrim, an
 * Escape listener) or elements addressable through a tagged ancestor belong here; "no `testId` input" isn't a
 * reason, since `[tnTestId]` works on any host.
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
 * Rule 4: {@link untaggedClickables} over `tn-*` tags, with a component's own id inputs counting as evidence.
 * A control bound by `[formControlName]` is skipped, since the library derives its id from the name. Reads
 * comment-stripped source (see {@link withoutComments}).
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
 * Rule 6: a value an e2e suite reads, i.e. a LEAF element whose own text interpolates data. A translated
 * literal is a label and doesn't count. The set is unbounded and some members aren't automation targets, so it
 * was driven to zero per area before gating; the rest are named in {@link allowedReadouts}.
 */
const leafValue = /<([a-z][a-z0-9-]*)((?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?)>([^<]*\{\{[^<]*)<\/\1>/gs;
/**
 * An interpolation's expression, which may itself contain a single `}` — a pipe argument is an
 * object literal (`| translate: { x: n() }`), and `[^}]*` stopped dead at its first brace, matched
 * nothing at all, and left the whole readout invisible to {@link readsData}. 20 readouts app-wide
 * were unseen that way. A literal `}}` inside the expression still cuts early: only the ICU plural
 * strings have one, and an Angular parser is the only thing that would read those correctly.
 */
const interpolations = /\{\{((?:[^}]|\}(?!\}))*)\}\}/g;

/**
 * A message hoisted into a `helptext` constant, which is a label like `{{ 'Name' | translate }}`, not a value.
 * It must be rooted at `helptext`, go through `translate`, and pass no arguments: a dynamic label through the
 * pipe, or `translate: { x: checkinRemaining() }` interpolating a live value, still counts as a readout.
 */
const helptextConstant = /^helptext\b/;
const translatePipe = /^translate$/;

/**
 * A string literal, escapes included. `[^']*` read `'…this system\'s license.'` as two literals
 * with an expression between them, so the Spotlight notice in the SMB service form counted as a
 * value although every character of it is fixed.
 */
const stringLiteral = /^'(?:[^'\\]|\\.)*'$|^"(?:[^"\\]|\\.)*"$/;

function readsData(text: string): boolean {
  return [...text.matchAll(interpolations)]
    .map(([, body]) => body.split('|').map((part) => part.trim()))
    .some(([head, ...pipes]) => head.length > 0
      && !stringLiteral.test(head)
      && !(helptextConstant.test(head) && pipes.some((pipe) => translatePipe.test(pipe))));
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
 * the ancestor and reads its text. `<ix-table-text-cell>` is the shape — the consumer tags the
 * tag, and the one value inside is what the element says.
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
 * Readouts that are deliberately unaddressable, keyed exactly like {@link allowedClickables} —
 * `<repo-relative path>:<class>`, or `<path>:<tag>` where the element has no class — and held to
 * the same standard: an entry that exempts nothing fails the run, so it cannot outlive the element
 * it was written for.
 *
 * Two shapes belong here: a surface no suite runs against, and text that is a label rather than a
 * value. A value a journey would assert on gets an id instead, however awkward its markup.
 */
const devOnlyPanel = 'The WebSocket debug panel is a development tool; no e2e journey opens it.';
const debugPanel = 'src/app/modules/websocket-debug-panel/components';
const allowedReadouts = new Map<string, string>([
  [`${debugPanel}/alert-classes-tab/alert-classes-tab.component.html:last-checked`, devOnlyPanel],
  [`${debugPanel}/alert-classes-tab/alert-classes-tab.component.html:error-message`, devOnlyPanel],
  [`${debugPanel}/alert-classes-tab/alert-classes-tab.component.html:h3`, devOnlyPanel],
  [`${debugPanel}/alert-classes-tab/alert-classes-tab.component.html:class-id`, devOnlyPanel],
  [`${debugPanel}/alert-classes-tab/alert-classes-tab.component.html:class-title`, devOnlyPanel],
  [`${debugPanel}/alert-classes-tab/alert-classes-tab.component.html:class-category`, devOnlyPanel],
  [`${debugPanel}/enclosure-mock-tab/enclosure-mock-tab.component.html:preview-value`, devOnlyPanel],
  [`${debugPanel}/message-list/message-list.component.html:method-name`, devOnlyPanel],
  [`${debugPanel}/message-list/message-list.component.html:timestamp`, devOnlyPanel],
  [`${debugPanel}/message-list/message-list.component.html:message-preview`, devOnlyPanel],
  [`${debugPanel}/mock-config/job-event-builder/job-event-builder.component.html:tn-card__title`, devOnlyPanel],
  [`${debugPanel}/mock-config/mock-config-list/mock-config-list.component.html:response-type`, devOnlyPanel],
  [`${debugPanel}/mock-config/mock-config-list/mock-config-list.component.html:config-type`, devOnlyPanel],
  ['src/app/pages/storage/modules/vdevs/vdevs.component.html:title-text', 'The translated words either side of the device name in the details header; the name itself is `text-vdev-details-title`.'],
]);

/** Entries of {@link allowedReadouts} that exempted a readout this run. */
const usedReadoutExemptions = new Set<string>();

/**
 * Lines of readouts in this template no suite can read, discounting a tagged ancestor holding just that value
 * and a shared leaf presenter tagged at every call site (see {@link taggedCallSites}). Returns lines, not a
 * count, so `--report <path>` can name each one.
 */
function untaggedReadouts(file: string, src: string, isSingleValueComponent: boolean): number[] {
  if (isSingleValueComponent) {
    return [];
  }
  const stripped = withoutComments(src);
  const lines: number[] = [];
  for (const match of stripped.matchAll(leafValue)) {
    const [, tag, attributes = '', text] = match;
    if (anyTestId.test(attributes) || !readsData(text)) {
      continue;
    }
    // Before every discount below, as in rule 3: the entry stays spent while the element it names
    // is still there, rather than retiring the moment the element gains a tagged ancestor.
    const exemption = [...classNames(attributes), tag]
      .map((name) => `${file}:${name}`)
      .find((key) => allowedReadouts.has(key));
    if (exemption) {
      usedReadoutExemptions.add(exemption);
      continue;
    }
    // A column header is the column's title — a label, like `{{ 'Name' | translate }}`, even when
    // it comes out of a `translated()` signal so the column picker can share it. The look-behind
    // below skipped most of them only by accident: it saw the *previous* column's `tnCellDef`
    // within 400 characters, so a header counted only when the column above it was short or it
    // was the first, which put 11 column titles on the `pages/data-protection` list.
    if (/\btnHeaderCellDef\b/.test(attributes)) {
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
    lines.push(stripped.slice(0, match.index).split('\n').length);
  }
  return lines;
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

/**
 * Whether a template is the listing path or sits under it.
 *
 * A bare `startsWith` is a string prefix, not a path one: `--report src/app/pages/share` listed
 * everything under `sharing/` while naming a directory that does not exist, which reads as though
 * the tool had found the area and it was nearly closed.
 */
function isUnder(file: string, listing: string): boolean {
  const base = listing.replace(/\/+$/, '');
  return file === base || file.startsWith(`${base}/`);
}

/**
 * Whether the nearest tagged ancestor of the tag at `at` holds that component and nothing else a
 * suite could read — the id is then the component's, merely written one element further out.
 *
 * `services.component.html` wraps `<ix-service-status-cell>` in `<span [tnTestId]="[…,
 * 'row-state']">`, and `e2e/locators/services.ts` reads the status off that span. Asking only for
 * an id on the component's own tag counted the pill inside as unreadable.
 */
function isSoleChildOfTaggedWrapper(src: string, at: number): boolean {
  const wrapper = taggedAncestorBlock(src, at);
  return wrapper !== null
    && [...wrapper.matchAll(componentTags)].length === 1
    && valueCount(wrapper) === 0;
}

/**
 * Selectors that are written as a tag somewhere and carry an id at *every* such call site.
 *
 * Read off the templates rather than guessed: a component opened through a route, a dialog or
 * `FormSidePanelService` appears as a tag nowhere at all, and one whose consumers tag it only
 * sometimes is unaddressable from the untagged ones.
 */
function taggedCallSites(templates: { file: string; src: string }[]): Set<string> {
  const uses = new Map<string, { total: number; tagged: number }>();
  for (const { src } of templates) {
    const stripped = withoutComments(src);
    for (const match of stripped.matchAll(componentTags)) {
      const attributes = match[2] ?? '';
      const entry = uses.get(match[1]) ?? { total: 0, tagged: 0 };
      entry.total += 1;
      if (anyTestId.test(attributes) || componentTestIdInput.test(attributes)
        || isSoleChildOfTaggedWrapper(stripped, match.index)) {
        entry.tagged += 1;
      }
      uses.set(match[1], entry);
    }
  }
  return new Set(
    [...uses].filter(([, { total, tagged }]) => total > 0 && total === tagged).map(([tag]) => tag),
  );
}

/** Every readout no suite can read, app-wide — rule 6's offenders and `--report`'s count. */
function unreadableReadouts(templates: { file: string; src: string }[]): Offender[] {
  const { templateBySelector, selectorByTemplate } = scanComponents();
  const tagged = taggedCallSites(templates);
  // A shared leaf presenter: one value, with an id at every call site, so the value inside needs none. Both
  // halves matter: "one value" alone hid readouts in routed pages, which no call site tags. Today that's the
  // row-scoped table cells plus `<ix-date>`, `<ix-warning>`, `<ix-status-badge>` and `<ix-empty>`; leave one
  // call site untagged and its readout counts again, by design.
  const singleValue = new Set(
    [...templateBySelector]
      .filter(([selector, template]) => valueCount(template) === 1 && tagged.has(selector))
      .map(([selector]) => selector),
  );

  return templates.flatMap(({ file, src }) => {
    // By path, from the same scan that resolved the `templateUrl`. Keying this on the template's
    // *contents* made two byte-identical templates collide, so the discount was applied for the
    // wrong selector — and it hashed every template in `src` in full to do it.
    const selector = selectorByTemplate.get(file);
    const sourceLines = src.split('\n');
    return untaggedReadouts(file, src, !!selector && singleValue.has(selector))
      .map((line) => ({ file, line, what: sourceLines[line - 1].trim() }));
  });
}

/**
 * `--report`: untagged value readouts per area — rule 6's offenders, counted rather than failed.
 *
 * A path given alongside `--report` also lists each readout under it as `file:line  <markup>`,
 * which is the working list for closing one area.
 */
function reportReadoutCoverage(templates: { file: string; src: string }[], listing?: string): void {
  const perArea = new Map<string, number>();
  for (const { file, line, what } of unreadableReadouts(templates)) {
    if (listing && isUnder(file, listing)) {
      console.info(`  ${file}:${line}  ${what}`);
    }
    const area = file.split('/').slice(0, 4).join('/');
    perArea.set(area, (perArea.get(area) ?? 0) + 1);
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
    const listing = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
    // A path that does not exist is a typo, and silently listing a prefix of it — or switching the
    // listing on for a stray argument — is worse than saying so: both look like an answer.
    if (listing !== undefined && !existsSync(listing)) {
      console.error(`\n❌ ${listing} does not exist.\n\nPass \`--report\` a path to list that area's`
        + ' readouts, e.g. `--report src/app/pages/sharing`, or no path at all for the totals.');
      process.exitCode = 1;
      return;
    }
    reportColumnCoverage(tables);
    reportReadoutCoverage(templates, listing);
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

  const readouts = unreadableReadouts(templates);

  const staleExemptions = [...allowedClickables.keys()]
    .filter((key) => !usedExemptions.has(key))
    .map((key) => ({ file: key.split(':')[0], line: 1, what: `no clickable matches "${key}"` }));

  const staleReadoutExemptions = [...allowedReadouts.keys()]
    .filter((key) => !usedReadoutExemptions.has(key))
    .map((key) => ({ file: key.split(':')[0], line: 1, what: `no readout matches "${key}"` }));

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

  report('exemptions in allowedReadouts that match nothing:', staleReadoutExemptions, `
Each of these names a readout that no longer exists, or that now carries an id of its own. Remove
the entry from \`allowedReadouts\` in this script, so the exemption cannot outlive what it was
written for.`);

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

  report('value readouts with no test id:', readouts, `
Each of these renders a value — a status, a size, a name, a message — that no \`[data-test]\`
selector can read: it has no id of its own, and no tagged ancestor holds just that value. Put
\`tnTestIdType="text"\` + \`[tnTestId]\` on the element, named after the label beside it, or on a
wrapper that holds nothing else. If it is genuinely not an automation target — a dev-only surface,
a fragment of a translated label — list it in \`allowedReadouts\` in this script with the reason.
See "Reading a value that is not in a table" in e2e/CLAUDE.md.`);

  if (!process.exitCode) {
    console.info(
      `✅ ${tables.length} tn-table templates tag their rows and every column; `
      + `${templates.length} templates carry no unaddressable action element, no untagged `
      + 'interactive component, no unreadable value readout, no inert tnTestId and no retired '
      + 'directive.',
    );
  }
}

main();
