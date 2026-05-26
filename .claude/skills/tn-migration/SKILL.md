---
name: tn-migration
description: >-
  Playbook for migrating webui feature-area page templates from Angular Material to
  @truenas/ui-components (tn-* components). Use when working on any child ticket of Epic
  NAS-141021 — any "Migrate <area> to tn-*" task — or when replacing mat-card, mat-button,
  mat-toolbar-row, matTooltip, ix-empty, info-message notices, or SlideIn-hosted forms with
  their tn-* equivalents. Covers the card, side-panel dual-host, declarative-signal, banner,
  empty-state, test-id, and spec-harness recipes established by the shares-dashboard pilot
  (NAS-141074).
---

# Angular Material → @truenas/ui-components migration playbook

This is the shared reference for the webui component-library migration (Epic
**NAS-141021**, "ER-66"). It encodes the pattern proven by the **shares-dashboard pilot
(NAS-141074)** so that every dev and every Claude session migrates a component the same way.

## Scope — what this playbook covers

This playbook is for **feature-area tickets**: replacing direct Angular Material usage in a
page area's own templates and components (NAS-141039–141065, plus the pilot NAS-141074).

It is **not** for the shared-infrastructure tickets. Do not migrate these here — they have
their own tickets and migrating them piecemeal will cause conflicts:

| Concern | Owning ticket | What to do in a feature-area migration |
|---|---|---|
| `ix-forms` internals (`ix-input`, `ix-select`, `ix-fieldset`, `ix-chips`, `ix-checkbox`) | NAS-141028 | **Leave as-is.** Keep using `ix-*` form controls. |
| `ix-table` and its sub-components | NAS-141029 | **Leave as-is.** |
| `DialogService` / dialog components | NAS-141022 | Keep calling `DialogService`. |
| `SnackbarService` | NAS-141027 | Keep calling `SnackbarService`. |
| SlideIn system / `modal-header` | NAS-141030 | Use the **dual-host recipe** below — do not delete `SlideIn`. |

Also leave alone: `ix-card-alert-badge`, `RequiresRolesDirective` where still used outside
declarative actions, and `tn-icon` (already migrated — always `tn-icon`, never `ix-icon`).

## Core principles

- **Manual, file-by-file. No codemods.** Read each component in full context and make
  verified changes. The transforms below are judgment calls, not mechanical substitutions.
- **One ticket owns a disjoint set of files.** Don't reach outside your ticket's files.
- **Preserve test IDs.** Automated tests match on `data-test` selectors — a dropped or
  renamed ID is a silent regression. See the Test IDs section.
- **Run the component's spec after every file.** `yarn test src/app/path/to/file.spec.ts`.

## Component & directive mapping

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<mat-card>` | `<tn-card>` | See card recipe. `mat-card { height: 100% }` SCSS is dropped. |
| `<mat-card-content>` | *(removed)* | Content goes directly inside `tn-card`. |
| `<mat-toolbar-row>` | *(removed)* | Header content moves to `tnCardHeader`; actions become inputs. |
| `<button mat-button>` | `<tn-button>` | `[label]` input + `(onClick)` output; `color="primary"`. |
| `[matTooltip]` | `[tnTooltip]` | `MatTooltip` → `TnTooltipDirective`. |
| `<ix-empty [conf]>` | `<tn-empty>` | See empty-state recipe. Drop the `*EmptyConfig` constant. |
| `info-message` notice `<div>` | `<tn-banner>` | See banner recipe. |
| `MatButtonHarness` (specs) | `TnButtonHarness` | `.with({ text })` → `.with({ label })`. |

Keep `EmptyService` (used by data providers) — only `EmptyComponent` is replaced.

## Recipe 1 — Card (`mat-card` → `tn-card`)

`tn-card` is declarative: the toolbar row disappears and its contents become **inputs**.

```html
<tn-card
  padding="small"
  [bordered]="true"
  [headerStatus]="serviceStatus()"          <!-- was <ix-service-state-button> -->
  [headerMenu]="serviceMenu()"              <!-- was <ix-service-extra-actions> -->
  [headerMenuTriggerTestId]="headerMenuTriggerTestId()"
  [primaryAction]="addAction()"             <!-- was the toolbar "Add" <button> -->
  [secondaryAction]="openAction()"          <!-- optional second toolbar button -->
>
  <a tnCardHeader class="card-title-link" [routerLink]="..." [ixTest]="[...]">
    <h3 class="card-title">{{ 'Title' | translate }}<tn-icon .../></h3>
  </a>

  <!-- card body: empty state, ix-table, pager, etc. stay here -->
</tn-card>
```

- The title link gets the `tnCardHeader` directive instead of living in a `<div>`.
- `MatCard`/`MatToolbarRow` imports → `TnCardComponent`, `TnCardHeaderDirective`.
- SCSS: delete `mat-card { height: 100% }`. Add `.card-title-link { color: inherit;
  display: inline-flex; text-decoration: none; }` and `.card-title { margin: 0; }`.

## Recipe 2 — Imperative → declarative signals

Toolbar buttons and status badges driven by `| async` become `computed()` signals typed to
the tn-card input contract. Convert the source observable with `toSignal()`:

```ts
service$ = this.store$.select(selectService(ServiceName.Cifs));
private service = toSignal(this.service$);
private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

protected serviceStatus = computed<TnCardHeaderStatus | undefined>(() => {
  const svc = this.service();
  if (!svc) { return undefined; }
  // map ServiceStatus → { label, type: 'success' | 'neutral' | 'warning', testId }
});

protected addAction = computed<TnCardAction | undefined>(() => {
  if (!this.hasAddRole()) { return undefined; }   // role gating replaces *ixRequiresRoles
  return { label: this.translate.instant('Add'), testId: 'button-...-add', handler: () => this.openForm() };
});
```

- A role-gated action returns `undefined` when the role is absent — this replaces
  `*ixRequiresRoles` on the old `<button>`.
- Import the input types: `TnCardAction`, `TnCardHeaderStatus`, `TnMenuItem`.

### Shared service-menu builders

Service cards build their `headerMenu` from **`ServiceActionsMenuService`**
(`shares-dashboard/service-extra-actions/service-actions-menu.service.ts`). Compose
`TnMenuItem[]` from its granular builders (`buildToggleItem`, `buildSessionsItem`,
`buildLogsItem`, …) rather than re-implementing menu logic. When a card needs a custom item
(e.g. opening config in a local side panel), substitute just that one item.

The `serviceStatus` mapper (`ServiceStatus` → `TnCardHeaderStatus`) must use the **same**
mapping across all service cards: `Running` → `success`, `Stopped` → `neutral`, anything
else → `warning`. Prefer a shared builder over copy-pasting the `switch` — divergence on
the `default` branch is an easy, silent inconsistency.

## Recipe 3 — Empty state (`ix-empty` → `tn-empty`)

```html
<!-- before --> <ix-empty [conf]="emptyConfig"></ix-empty>
<!-- after  --> <tn-empty icon="smb-share" iconLibrary="custom" [title]="'...' | translate"></tn-empty>
```

Inline the icon/title from the old `*EmptyConfig` constant, then delete the constant import
and the component field. `EmptyComponent` import → `TnEmptyComponent`.

**Known gap — empty-state icon size.** `tn-empty` has no `iconSize` input yet, so the icon
renders at the inline ~24px scale — too small for a card empty state. The pilot works
around this with one shared block in `shares-dashboard.component.scss`:

```scss
// TEMP: until @truenas/ui-components ships the tn-empty `iconSize` input.
:host ::ng-deep tn-empty tn-icon { width: 56px; height: 56px; font-size: 56px; }
```

If your area needs sized empty-state icons, reuse that **exact** selector — do not invent a
different one. Keep the `// TEMP` marker; it is removed in favour of `[iconSize]` once the
library ships the input. This is the only sanctioned `::ng-deep` into a `tn-*` internal.

## Recipe 4 — Banner (`info-message` notice → `tn-banner`)

```html
<tn-banner
  class="clickable"
  role="button" tabindex="0"
  [heading]="'WebShares unavailable' | translate"
  [message]="'WebShare service requires TrueNAS Connect...' | translate"
  (click)="openDialog()"
  (keydown.enter)="openDialog()"
  (keydown.space)="openDialog(); $event.preventDefault()"
></tn-banner>
```

Keep the `role`/`tabindex`/keyboard handlers. `tn-banner` adds a `[heading]` — write
concise heading copy; the old single-line message becomes `[message]`. The inner
`tn-icon`/`<span>` are dropped — `tn-banner` renders its own icon and message. `aria-live`
is dropped on the assumption that `tn-banner` emits its own live-region announcement —
**verify this on first use with a screen reader.** If it does not, file a library bug and
add a wrapping `aria-live="polite"` element back until fixed; a silent banner is a real
regression for screen-reader users.

## Recipe 5 — SlideIn form → `tn-side-panel` (dual-host)

This is the subtle one. A form previously opened only via `SlideIn` must work **both**
hosted in a `tn-side-panel` and via the legacy `SlideIn` (other call sites still use it
until NAS-141067/NAS-141030 land). Make the form host-agnostic:

**Form component (`service-*.component.ts`):**

```ts
// Optional: present via legacy SlideIn host, absent inside <tn-side-panel>.
slideInRef = inject(SlideInRef<undefined, boolean>, { optional: true });
readonly closed = output<boolean>();                 // emitted to a tn-side-panel host
readonly isFormLoading = signal(false);              // public — host may read it

private formStatus = toSignal(
  this.form.statusChanges.pipe(startWith(this.form.status)),
  { initialValue: this.form.status },
);
readonly canSubmit = computed(() => this.formStatus() === 'VALID' && !this.isFormLoading());

constructor() {
  this.slideInRef?.requireConfirmationWhen(() => of(this.form.dirty));   // note ?.
}

submit(): void { this.onSubmit(); }                  // public entry point for the host

private close(saved: boolean): void {
  if (this.slideInRef) { this.slideInRef.close({ response: saved }); }
  else { this.closed.emit(saved); }
}
```

Inject `SlideInRef` with the `inject(SlideInRef<…>, { optional: true })` call form shown
above — **not** `inject<SlideInRef<…>>(SlideInRef, …)`. Both compile; standardize on the
first so the codebase stays consistent. Replace every `slideInRef.close({ response })` with
`this.close(...)`. Members the host reads through its `viewChild` reference (`submit`,
`canSubmit`, `closed`) **must be public**.

**Form template (`service-*.component.html`):** the `<mat-card><mat-card-content>` wrapper
is removed so `<form>` is top-level; `<ix-modal-header>` is kept but gated for the legacy
host only:

```html
@if (slideInRef) {
  <ix-modal-header [requiredRoles]="requiredRoles" [title]="'SMB' | translate" [loading]="isFormLoading()" />
}
<form class="ix-form-container" [formGroup]="form" (submit)="onSubmit()">
  <!-- fieldsets ... -->
  <ix-form-actions>
    @if (slideInRef) {
      <tn-button
        *ixRequiresRoles="requiredRoles" color="primary"
        [ixTest]="'save'" [label]="'Save' | translate"
        [disabled]="form.invalid || isFormLoading()" (onClick)="onSubmit()"
      ></tn-button>
    }
    <!-- non-Save actions (e.g. an Advanced Settings toggle) stay UNgated -->
  </ix-form-actions>
</form>
```

The in-form Save `tn-button` is gated to the legacy host — the `tn-side-panel` host renders
its own Save in the panel footer (next snippet), so an ungated in-form Save would render
twice. Any *other* form actions stay ungated.

**Host card (the `tn-side-panel`):** placed after `</tn-card>`. The form is referenced via
`viewChild`; the Save button lives in the panel footer slot:

```html
<tn-side-panel [title]="'SMB' | translate" [(open)]="configOpen">
  @if (configOpen()) {
    <ix-service-smb (closed)="onConfigClosed()"></ix-service-smb>
  }
  @if (configForm(); as form) {
    <tn-button
      tnSidePanelAction color="primary"
      [ixTest]="'save'" [label]="'Save' | translate"
      [disabled]="!form.canSubmit()" (onClick)="form.submit()"
    ></tn-button>
  }
</tn-side-panel>
```

```ts
protected configOpen = signal(false);
protected configForm = viewChild(ServiceSmbComponent);
protected onConfigClosed(): void { this.configOpen.set(false); }
```

The menu's "Config Service" item action becomes `() => this.configOpen.set(true)` instead
of `slideIn.open(...)`.

**A11y — focus management.** When the panel opens, focus must move *into* it; when it
closes, focus must return to the trigger element. Escape must close the panel. These are
`tn-side-panel`'s responsibility — the legacy `SlideIn` host had them built in, do not
silently regress. Verify each migrated panel on first use; if any of the three is missing,
file a library bug rather than papering over it with imperative focus calls.

## Test IDs — do not drop them

webui automated tests select on `data-test`. The library is configured once (already done
in `main.ts`) to honor this:

- `{ provide: TN_TEST_ATTR, useValue: 'data-test' }` routes tn-component `testId` inputs
  through `data-test`.
- `test.directive.ts` maps `tn-button` → `button`, so `[ixTest]` on a `<tn-button>`
  produces the same `button-*` value the old `mat-button` had.

The trap: when an element disappears (a toolbar `<button>` becomes a `TnCardAction`, a
`<button mat-menu-item>` becomes a `TnMenuItem`), it no longer carries an `[ixTest]`
directive. **Reconstruct the ID as a string** and pass it via the component input — `testId`
on `TnCardAction` / `TnMenuItem`, `headerMenuTriggerTestId` on `tn-card`. Match the exact
value the old directive produced (it kebab-cases parts and prepends an element-type prefix
like `button-`). `ServiceActionsMenuService.menuItemTestId()` is the reference for menu-item
IDs — reuse it, don't hand-roll the string.

## Spec / test updates

- Swap harnesses: `MatButtonHarness` → `TnButtonHarness` (`.with({ text })` →
  `.with({ label })`); new `TnBannerHarness` for banners (`.with({ textContains: /re/ })`,
  `await banner.getText()`). Prefer harnesses over `spectator.query('.css-class')`.
- When a component is deleted (e.g. `ServiceStateButtonComponent`,
  `ServiceExtraActionsComponent`), remove it from `MockComponents(...)` and delete the
  import.
- Signal-based `viewChild` (e.g. `viewChild(ServiceSmbComponent)`) needs the real child
  rendered for panel tests — don't mock it away if the test exercises the side panel.
- Run `yarn test src/app/.../file.spec.ts` per file; `yarn lint <file>` before commit.

## Accessibility — verify per migration

The migration trades baked-in Material a11y for declarative `tn-*` slot inputs whose a11y
is the library's responsibility. That delegation is silent: a missing `aria-label` on a
`TnCardAction`, a `tn-banner` that doesn't announce, a `tn-side-panel` that doesn't return
focus — none surface in a compile error or a visual review. Verify per recipe:

- **Accessible names.** Every interactive `tn-*` carries a meaningful `[label]` or
  `aria-label`. An icon-only `tn-button` / `tn-icon-button` MUST have `[attr.aria-label]`
  (or the equivalent component input) — a bare icon button is unusable on a screen reader.
- **No element-level a11y silently dropped.** When a `<button aria-label="…">` becomes a
  `TnCardAction` / `TnMenuItem`, the aria value moves into the action object — never
  disappears. Diff against `git show $(git merge-base master HEAD):<path>` if unsure.
- **Status mapping is not color-only.** `TnCardHeaderStatus` carries `label` text in
  addition to `type` (`success` / `neutral` / `warning`); the label must be meaningful
  text — Running / Stopped / etc. — not empty, so status is conveyed without colour.
- **Live-region announcements.** `tn-banner`'s dropped `aria-live` assumes the component
  announces. Verify on first use; if not, file a library bug and add a wrapping live
  region until fixed.
- **Focus management on `tn-side-panel`.** Opening moves focus into the panel; closing
  returns focus to the trigger; Escape closes. Verify per migrated panel.
- **Tooltips are not the only description.** `[tnTooltip]` on a hover surface is not an
  accessible description on its own. For form controls, prefer the `[tooltip]` input on
  `ix-input` / `ix-checkbox` / etc. (which produces an accessible description) and use
  `[tnTooltip]` only for hover-only context — the disabled-state hint pattern in
  `nvme-of-configuration` is the canonical use.
- **Keyboard reachability.** Tab through the migrated page: every interactive element is
  focusable in source order, focus is visible at every step, Enter/Space activate as
  expected.

The visual smoke agent (`tn-migration-visual`) runs an axe-core scan that catches a
meaningful subset of these automatically; the harness agent (`tn-migration-harness`)
mandates a `jest-axe` assertion in the spec. Use those as the safety net, not the
ceiling — keyboard and screen-reader smoke on first use of each new surface is
irreplaceable.

## Per-file verification checklist

Before committing a migrated file, confirm:

- [ ] No `mat-*` / `Mat*` left in the template or `imports` array (unless owned by another ticket).
- [ ] No `@angular/material` imports left in the `.ts` (unless owned by another ticket).
- [ ] Every old `[ixTest]` / `data-test` value still exists — on an element or via a
      `testId`/`*TestId` input. None silently dropped.
- [ ] All visible strings still go through the `translate` pipe / `TranslateService`.
- [ ] `ChangeDetectionStrategy.OnPush` retained; new state is signals/`computed`, not fields.
- [ ] Dual-host forms: `slideInRef` is `{ optional: true }`, `?.` used on it, `closed`
      output present, `submit()`/`canSubmit` public.
- [ ] Component spec updated to tn-harnesses and passing.
- [ ] a11y: every interactive `tn-*` has an accessible name; element-level aria attrs
      preserved on element→input conversions; new live regions verified (or a library bug
      filed); side-panel focus return verified.
- [ ] `yarn lint` clean on the file.

## Branch & commit conventions

- Branch: `NAS-<ticket>` (e.g. `NAS-141040`).
- Commits: `NAS-<ticket>: <description>`, one line, scoped to one component/step.
- The pilot branch `NAS-141074` is the canonical worked example — diff it for any case
  this playbook doesn't spell out.
