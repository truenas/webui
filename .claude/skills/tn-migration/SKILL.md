---
name: tn-migration
description: >-
  Playbook for migrating webui feature-area page templates from Angular Material to
  @truenas/ui-components (tn-* components). Use when working on any child ticket of Epic
  NAS-141021 — any "Migrate <area> to tn-*" task — or when replacing any mat-* element
  (card, button, button-toggle, menu, select, toolbar, tooltip, list, tabs, stepper,
  expansion, slide-toggle, slider, checkbox, radio, datepicker, dialog, snackbar, table,
  tree, divider, autocomplete, sidenav, progress-bar/spinner, etc.), ix-empty, info-message
  notices, or SlideIn-hosted forms with their tn-* equivalents. Contains a comprehensive
  Material → tn-* component map plus the card, side-panel dual-host, declarative-signal,
  banner, empty-state, table, button-toggle, test-id, and spec-harness recipes established
  by the shares-dashboard pilot (NAS-141074) and the audit-page migration (NAS-141063).
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

This is the first lookup for "what does `mat-X` become?" The map describes the library
state at `@truenas/ui-components@0.1.60`. For any non-obvious API (input names,
projection slots, default values), **always verify against the installed types**:
`node_modules/@truenas/ui-components/types/truenas-ui-components.d.ts`. The map can lag
behind library releases; the `.d.ts` cannot.

Rows in the **Notes** column flagged **⚠** are non-obvious gotchas — read them before
swapping. Rows where the **tn-\*** column is *(no equivalent yet — hold)* mean the library
hasn't shipped a replacement; do **not** silently leave the Material element in place —
either keep the legacy surface and surface to NAS-141021 lead, or skip that surface in
the ticket and document it in the PR.

### Cards & layout

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<mat-card>` | `<tn-card>` | See **Recipe 1**. `mat-card { height: 100% }` SCSS is dropped. |
| `<mat-card-content>` | *(remove)* | Content goes directly inside `tn-card`. `[padContent]="true"` (default) controls inner padding. |
| `<mat-card-header>` | `[tnCardHeader]` projection directive | Projected `<ng-content select="[tnCardHeader]">` slot. ⚠ If you project, the library suppresses its own `<h3 class="tn-card__title">` — see Recipe 1's "four header patterns." |
| `<mat-card-title>` | `[title]` input *or* `tnCardHeader` projection | ⚠ Mutually exclusive — picking projection means you own the title styling (use class `tn-card__title` on your `<h3>` to match library defaults). |
| `<mat-card-subtitle>` | *(no equivalent)* | No subtitle slot on `tn-card`. Render inside `tnCardHeader` projection if needed. |
| `<mat-card-actions>` | `[primaryAction]` / `[secondaryAction]` / `[footerLink]` typed inputs | Typed slot objects (`TnCardAction`/`TnCardFooterLink`), not projection. |
| `<mat-toolbar>` | *(no equivalent — hold)* | Pages don't get a generic toolbar. If this is in-card, fold into `tnCardHeader`. If page-level, surface to lead. |
| `<mat-toolbar-row>` | *(remove)* | Header content moves to `tnCardHeader`; actions become typed slot inputs. |
| `<mat-divider>` | `<tn-divider>` *or* `[tnDivider]` directive | `TnDividerComponent` for standalone; `TnDividerDirective` for inline list separation. |
| `<mat-grid-list>` / `<mat-grid-tile>` | *(no equivalent)* | Use CSS grid directly. |
| `<mat-expansion-panel>` / `<mat-accordion>` | `<tn-expansion-panel>` | `TnExpansionPanelComponent`/`TnExpansionPanelHarness`. Verify input names against d.ts. |
| `<mat-sidenav-container>` / `<mat-sidenav>` / `<mat-sidenav-content>` | `<tn-drawer-container>` / `<tn-drawer>` / `<tn-drawer-content>` | ⚠ For a page-level side panel hosting a *form*, use `<tn-side-panel>` (Recipe 5) instead — drawer is for persistent UI chrome. |

### Buttons & toggles

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<button mat-button>` | `<tn-button>` | `[label]` input + `(onClick)` output. NOT content projection + `(click)`. |
| `<button mat-raised-button>` | `<tn-button variant="filled">` | |
| `<button mat-stroked-button>` | `<tn-button variant="outline">` | |
| `<button mat-flat-button>` | `<tn-button variant="filled" color="default">` | |
| `<a mat-button [routerLink]>` | `<tn-button [routerLink]>` | ⚠ `tn-button` accepts `[routerLink]`/`[href]` but renders an internal `<button>`, not `<a>`. Verify middle-click "open in new tab," right-click context menu, and focus parity. The test-id prefix also shifts (`link-*` → `button-*`); see "Test IDs." |
| `<button mat-icon-button>` | `<tn-icon-button>` | ⚠ Bare icon-only buttons MUST have `[ariaLabel]` — no accessible name otherwise. |
| `<button mat-fab>` / `<button mat-mini-fab>` | *(no equivalent — hold)* | No FAB component. Rework to a primary action button or surface to lead. |
| `<mat-button-toggle-group>` / `<mat-button-toggle>` | `<tn-button-toggle-group>` / `<tn-button-toggle>` | See **Recipe 7**. ⚠ No `[label]` input — must provide `[ariaLabel]` or `[ariaLabelledby]`. ⚠ Per-option test IDs are not auto-synthesized; add `[ixTest]` per `<tn-button-toggle>`. |
| `[matRipple]` | *(remove)* | Ripple is built into tn-* components where appropriate. Drop the directive. |
| `[matBadge]` / `[matBadgeHidden]` | *(no equivalent — hold)* | No badge component. Use `<tn-chip>` for static labels, or hold migration on the surface if notification-count semantics are needed. |

### Menus & tooltips

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<mat-menu>` | `<tn-menu>` | `[items]` input takes `TnMenuItem[]`. See `ServiceActionsMenuService` for the composition pattern (Recipe 2). |
| `<button mat-menu-item>` | `<tn-menu-item>` | ⚠ `[ixTest]` resolves to `menu-item-*`, not `button-*`. Fix mapping in `test.directive.ts` (`tn-menu-item → "button"`) to preserve legacy IDs; until then pass `testId="button-foo"` literal. See "Test IDs." |
| `[matMenuTriggerFor]` | `[tnMenuTriggerFor]` | `TnMenuTriggerDirective`; same usage shape. |
| `[matTooltip]` | `[tnTooltip]` | `TnTooltipDirective`. ⚠ Tooltips are not accessible descriptions on their own — for form controls prefer the `[tooltip]` input on `ix-input`/`ix-checkbox`/etc., reserve `[tnTooltip]` for hover-only context (disabled-state hints, etc.). |

### Form controls

Forms are owned by **NAS-141028** — most form-field surfaces stay on the `ix-*` wrappers
(`ix-input`, `ix-select`, `ix-checkbox`, `ix-chips`, `ix-fieldset`). The `tn-*` form
primitives below are for **non-form display surfaces** (toolbar filters, selection cards,
read-only views) unless a feature-ticket explicitly carries `ix-*` work.

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<mat-form-field>` / `<input matInput>` | *(use `ix-input` — NAS-141028 owns)* | Library does export `TnFormFieldComponent`/`TnInputComponent`/`TnInputDirective`, but feature tickets keep `ix-*`. |
| `<mat-hint>` / `<mat-error>` | *(use `ix-input` hint/error inputs)* | Same — owned by `ix-forms`. |
| `<mat-select>` / `<mat-option>` | `<tn-select>` *(non-form)* or `<ix-select>` *(forms)* | ⚠ `tn-select` has no `[required]` input — required indicator is silently dropped. ⚠ No `[ariaLabelledby]`; use `[ariaLabel]` for accessible name. For form contexts, keep `ix-select`. |
| `<mat-select-trigger>` | *(use `tn-select`'s `[displayWith]` if available, else hold)* | Verify against d.ts; the trigger-template pattern may not be supported. |
| `<mat-autocomplete>` / `[matAutocomplete]` | `<tn-autocomplete>` | `TnAutocompleteComponent`/`TnAutocompleteHarness`. Verify input shape against d.ts. |
| `<mat-checkbox>` | `<tn-checkbox>` *(non-form)* or `<ix-checkbox>` *(forms)* | `TnCheckboxComponent`/`TnCheckboxLabelDirective`. Forms keep `ix-checkbox`. |
| `<mat-radio-group>` / `<mat-radio-button>` | `<tn-radio>` *(non-form)* or `<ix-radio>` *(forms)* | |
| `<mat-slide-toggle>` | `<tn-slide-toggle>` *(non-form)* or `<ix-slide-toggle>` *(forms)* | |
| `<mat-slider>` | `<tn-slider>` + `[tnSliderThumb]` | Also `TnSliderWithLabelDirective`. |
| `<mat-chip-grid>` / `<mat-chip-row>` (input pattern) | *(use `ix-chips` — NAS-141028 owns)* | |
| `<mat-chip>` (display only) | `<tn-chip>` | `TnChipComponent` for static display chips. |
| `<mat-datepicker>` / `<input matDatepicker>` / `<mat-datepicker-toggle>` | `<tn-date-input>` | `TnDateInputComponent` plus `TnDateRangeInputComponent`, `TnCalendarComponent`, `TnCalendarHeaderComponent`, `TnMonthViewComponent`, `TnMultiYearViewComponent`. Verify against d.ts. |
| `<mat-calendar>` | `<tn-calendar>` | Standalone; pair with `<tn-calendar-header>` if needed. |
| *(none — new surface)* | `<tn-time-input>` | `TnTimeInputComponent` — no Material equivalent in webui; available if needed. |

### Navigation

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<mat-tab-group>` / `<mat-tab>` | `<tn-tabs>` / `<tn-tab>` + `<tn-tab-panel>` | `TnTabsComponent`/`TnTabComponent`/`TnTabPanelComponent`. Verify input shapes against d.ts before swap — the tabs API often differs in subtle ways. |
| `<mat-tab-nav-panel>` / `<mat-tab-link>` | *(no direct equivalent)* | Tab-nav (link-based) is not 1:1 mapped; use `<tn-tabs>` if appropriate or hold. |
| `<mat-stepper>` / `<mat-step>` | `<tn-stepper>` / `<tn-step>` | `TnStepperComponent`/`TnStepComponent`. Verify against d.ts; horizontal/vertical mode may be expressed differently. |
| `<mat-vertical-stepper>` / `<mat-horizontal-stepper>` | `<tn-stepper>` with orientation input | Verify input name. |

### Tables, lists, trees

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<mat-table>` etc. | `<tn-table>` *(non-form)* or `<ix-table>` *(NAS-141029 owns)* | See **Recipe 6**. `tn-table` is intentionally smaller surface than `ix-table` — verify every input/output against d.ts. ⚠ `.tn-table__*` classes are NOT public; any `::ng-deep` into them requires a `// TEMP` marker + library follow-up. |
| `[matSort]` / `[mat-sort-header]` | `[sortable]` on `*tnColumnDef` + `(sortChange)` | Built into `tn-table`'s column-def directive. |
| `[matColumnDef]` | `*tnColumnDef` | Structural directive on `<ng-container>` with `<ng-template tnHeader>` / `<ng-template tnCell>`. |
| `<mat-paginator>` | `<tn-table-pager>` | `TnTablePagerComponent`/`TnTablePagerHarness`. Use `TN_TABLE_PAGER_LABELS` provider for i18n (replacement for `MatPaginatorIntl`); default labels in `TN_TABLE_PAGER_DEFAULT_LABELS`. |
| `<mat-list>` / `<mat-list-item>` | `<tn-list>` / `<tn-list-item>` | Plus `TnListItemTitleDirective`/`TnListItemPrimaryDirective`/`TnListItemSecondaryDirective`/`TnListItemLineDirective`/`TnListItemTrailingDirective`/`TnListAvatarDirective`/`TnListIconDirective`/`TnListSubheaderComponent` for slots. |
| `<mat-nav-list>` | `<tn-list>` with `[routerLink]` on items | No dedicated nav-list — use list + per-item routerLink. |
| `<mat-selection-list>` / `<mat-list-option>` | `<tn-selection-list>` / `<tn-list-option>` | `TnSelectionListComponent`/`TnListOptionComponent`. |
| `<mat-tree>` / `<mat-tree-node>` / `<mat-nested-tree-node>` | `<tn-tree>` / `<tn-tree-node>` / `<tn-nested-tree-node>` | Plus `TnTreeFlatDataSource`, `TnTreeFlattener`, `TnTreeNodeOutletDirective`. |

### Feedback & overlays

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<mat-progress-bar>` | `<tn-progress-bar>` *or* `<tn-particle-progress-bar>` | `TnProgressBarComponent` for standard; `TnParticleProgressBarComponent` for the animated variant. |
| `<mat-progress-spinner>` / `<mat-spinner>` | `<tn-spinner>` *or* `<tn-branded-spinner>` | `TnSpinnerComponent` / `TnBrandedSpinnerComponent`. |
| `MatSnackBar` (service) | `TnToastService` (via `SnackbarService` — NAS-141027 owns) | ⚠ Don't call `TnToastService` directly from feature pages — go through `SnackbarService`. Known a11y gap: no `politeness` input — `error()` no longer announces `assertive`. |
| `MatDialog` (service) | (call `DialogService` — NAS-141022 owns) | Library exports `TnDialog`/`TnDialogShellComponent`/`TnConfirmDialogComponent`, but feature tickets call `DialogService`, not the library directly. |
| `<mat-dialog-content>` / `<mat-dialog-actions>` / `[matDialogClose]` | *(via `DialogService` — NAS-141022 owns)* | |
| `<mat-bottom-sheet>` | *(no equivalent — hold)* | Surface to lead; bottom-sheet pattern not present in tn-*. |
| `info-message` notice `<div>` | `<tn-banner>` | See **Recipe 4**. Plus `TnBannerActionDirective` for action buttons inside a banner. |

### Indicators

| Angular Material | @truenas/ui-components | Notes |
|---|---|---|
| `<mat-icon>` | `<tn-icon>` | webui already migrated; always `tn-icon`, never `ix-icon`. |
| `<ix-empty [conf]>` | `<tn-empty>` | See **Recipe 3**. Inline `icon`/`iconLibrary`/`[title]`; drop the `*EmptyConfig` constant. ⚠ No `iconSize` input — use the sanctioned `::ng-deep` workaround. |

### Library-only (no Material counterpart)

These tn-* components have no Material equivalent in webui but may be appropriate for new
work or pattern replacements. Listed so the conformance agent recognizes them as valid
surface area:

- `TnSidePanelComponent` + `TnSidePanelActionDirective` + `TnSidePanelHeaderActionDirective` — see **Recipe 5**.
- `TnFilePickerComponent` / `TnFilePickerPopupComponent` — file picker.
- `TnKeyboardShortcutComponent` + `TnKeyboardShortcutService` — shortcut display & registration.
- `TnConfirmDialogComponent` — confirmation dialog body (consumed via `DialogService`).

### CDK / shared infra — keep

The `@angular/cdk/*` packages are not migrated (they're framework-level primitives, not
Material UI). Leave these alone:

- `cdkTrapFocus`, `cdkAriaLive`, `Overlay`, `OverlayRef` (a11y/overlay primitives — the library uses them internally too)
- `cdkScrollable`, `CdkVirtualScrollViewport`
- `cdkDrag`, `cdkDropList`
- `Portal`, `CdkPortalOutlet`

### Specs / harnesses

| Angular Material harness | @truenas/ui-components harness | Notes |
|---|---|---|
| `MatButtonHarness` | `TnButtonHarness` | `.with({ text })` → `.with({ label })`. |
| `MatIconHarness` | `TnIconHarness` | |
| `MatCheckboxHarness` | `TnCheckboxHarness` | |
| `MatRadioHarness` | `TnRadioHarness` | |
| `MatSlideToggleHarness` | `TnSlideToggleHarness` | |
| `MatSelectHarness` | `TnSelectHarness` | |
| `MatAutocompleteHarness` | `TnAutocompleteHarness` | |
| `MatMenuHarness` | `TnMenuHarness` | |
| `MatTableHarness` / `MatHeaderCellHarness` etc. | `TnTableHarness` | Smaller surface — see Recipe 6 for the full method list. |
| `MatPaginatorHarness` | `TnTablePagerHarness` | |
| `MatTabGroupHarness` | `TnTabsHarness` / `TnTabHarness` / `TnTabPanelHarness` | |
| `MatExpansionPanelHarness` | `TnExpansionPanelHarness` | |
| `MatFormFieldHarness` | `TnFormFieldHarness` | (rare — forms keep `IxFormHarness`) |
| `MatInputHarness` | `TnInputHarness` | (rare — forms keep `IxInputHarness`) |
| `MatDatepickerInputHarness` | `TnDateInputHarness` / `TnDateRangeInputHarness` | |
| `MatDialogHarness` | `TnDialogHarness` + `TnDialogTesting` | |
| `OverlayContainerHarness` (snackbar) | `TnToastMock` + `TnToastTesting.providers(...)` | See NAS-141027 spec for the pattern. |

Keep `EmptyService` (used by data providers) — only `EmptyComponent` is replaced.

## Recipe 1 — Card (`mat-card` → `tn-card`)

`tn-card` is declarative: the toolbar row disappears and its contents become **inputs**.

### Four header patterns — pick exactly one

The library's `<tn-card>` template renders its header from this slot:

```html
<div class="tn-card__header">
  <div class="tn-card__header-left">
    <ng-content select="[tnCardHeader]" />
    @if (!projectedHeader() && title()) {
      <h3 class="tn-card__title">{{ title() }}</h3>      <!-- LIBRARY-OWNED -->
    }
  </div>
  @if (hasHeaderRight()) {
    <div class="tn-card__header-right">
      @if (headerStatus()) { … }
      @if (headerControl()) { <tn-slide-toggle … /> }
      @if (headerMenu()) { <tn-icon-button [tnMenuTriggerFor]=… /> }
    </div>
  }
</div>
```

⚠ **Projecting `[tnCardHeader]` suppresses the library's `<h3 class="tn-card__title">`.**
You cannot combine `[title]` + `[tnCardHeader]` and get both — the library only renders
its own `<h3>` when no projection is present. This is the audit-page Event Data card
trap: the migration projected a custom `<h3 class="card-title">` with no styles,
inherited browser-default h3 margins, and the divider drifted.

The four valid patterns:

**A. Text-only title + typed right-side slots.** Simplest. Use when the header is just a
title plus an optional status badge, slide toggle, or kebab menu — nothing else.

```html
<tn-card
  padding="small"
  [title]="'Metadata' | translate"
  [headerStatus]="serviceStatus()"
  [headerMenu]="serviceMenu()"
>
  <!-- body -->
</tn-card>
```

**B. Custom projection with library title styling.** Use when you need a trailing element
the typed slots don't cover (copy button, custom action, link icon next to title). Apply
class `tn-card__title` to your `<h3>` so it matches the library default; do not redo the
flex layout — `.tn-card__header` is already `display: flex; justify-content: space-between`.

```html
<tn-card padding="small">
  <h3 tnCardHeader class="tn-card__title">{{ 'Event Data' | translate }}</h3>
  <ix-copy-button tnCardHeader [text]="yaml()"></ix-copy-button>
  <!-- body -->
</tn-card>
```

Both projected nodes match `[tnCardHeader]` and land in `.tn-card__header-left`; the
library's outer flex separates them.

**C. Title-link projection (shares-dashboard service-card pattern).** Use when the title
is a navigation link with a trailing icon, paired with typed right-side slots.

```html
<tn-card
  padding="small"
  [bordered]="true"
  [headerStatus]="serviceStatus()"
  [headerMenu]="serviceMenu()"
  [headerMenuTriggerTestId]="headerMenuTriggerTestId()"
  [primaryAction]="addAction()"
  [secondaryAction]="openAction()"
>
  <a tnCardHeader class="card-title-link" [routerLink]="…" [ixTest]="[…]">
    <h3 class="tn-card__title">{{ 'Title' | translate }}<tn-icon … /></h3>
  </a>
  <!-- body -->
</tn-card>
```

SCSS for this pattern: `.card-title-link { color: inherit; display: inline-flex;
text-decoration: none; }`. Use class `tn-card__title` (library) over a local `.card-title`
where possible — drift between local and library title styling is the recurring source
of divider/height inconsistencies.

**D. No header at all.** Don't set `[title]`, don't project `tnCardHeader`, don't set
the right-side slots. `hasHeader()` returns false and the entire `.tn-card__header` (and
its divider) are not rendered.

### Footer slots

The footer mirrors the header — typed inputs only, no projection slot. Use `[primaryAction]`
(filled button), `[secondaryAction]` (outline button), `[footerLink]` (text-button link).
The library renders `.tn-card__footer` with its own top divider only when at least one
footer input is set. Don't hand-roll a footer `<div>` inside the card body.

### Imports & SCSS

- `MatCard`/`MatToolbarRow` imports → `TnCardComponent`, `TnCardHeaderDirective`.
- Delete `mat-card { height: 100% }` SCSS.
- Do not redefine `.tn-card__title` styling locally — use the library class. The only
  sanctioned local card classes are `.card-title-link` (for pattern C) and any custom
  body styles.
- Do not call the legacy `details-card()` mixin from `src/assets/styles/mixins/cards.scss`
  on a `tn-card` host — it targets `.mat-mdc-card-title` / `mat-card-header` / `mat-card-content`
  internals and silently no-ops against `<tn-card>`.

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

## Recipe 6 — Table (`ix-table` / `mat-table` → `tn-table`)

`tn-table` is intentionally a smaller surface than `ix-table` — verify every input/output
you use against `node_modules/@truenas/ui-components/types/truenas-ui-components.d.ts`.
What's available in 0.1.60:

- **Inputs:** `dataSource`, `displayedColumns`, `trackBy`, `emptyMessage`, `emptyIcon`,
  `selectable`, `expandable`, `bordered`, `activeRow`, `activeBg`, `activeIndicator`,
  `loading`, `loadingMessage`, `clickable`.
- **Outputs:** `sortChange`, `selectionChange`, `rowClick`.
- **Column defs:** `<ng-container *tnColumnDef="name" [width] [sortable]>` with
  `<ng-template tnHeader>` / `<ng-template tnCell>` for header and cell content.

```html
<tn-table
  [dataSource]="dataProvider().rows"
  [displayedColumns]="displayedColumns"
  [loading]="dataProvider().isLoading"
  [emptyMessage]="emptyMessage()"
  [emptyIcon]="emptyIcon()"
  [activeRow]="selectedRowIndex()"
  [clickable]="true"
  (rowClick)="onRowClick($event)"
  (sortChange)="onSortChange($event)"
>
  <ng-container *tnColumnDef="'username'" [width]="'30%'">
    <ng-template tnHeader>{{ 'User' | translate }}</ng-template>
    <ng-template tnCell let-row>{{ row.username }}</ng-template>
  </ng-container>
  <!-- ... -->
</tn-table>
```

- **Row interaction.** Prefer `(rowClick)` for navigation/details; use
  `[selectable] + (selectionChange)` for multi-select. Do not wrap rows in a `<button>` —
  `tn-table` handles row roles internally.
- **Column widths.** Use `[width]` on `tnColumnDef`, not CSS. If you need fixed
  table-layout or cell-wrap behaviour the library doesn't expose, a `::ng-deep tn-table
  { ... }` block is permitted but **must carry a `// TEMP` marker and a library
  follow-up reference** (same convention as the `tn-empty` icon-size workaround in
  Recipe 3). A bare `::ng-deep` into `tn-table` internals is a finding.
- **Specs.** Use `TnTableHarness` — `getRowCount`, `getHeaderTexts`, `getRowTexts`,
  `getCellText`, `clickSortHeader`, `getSortDirection`, `toggleSelectAll`,
  `toggleRowSelection`, `isRowSelected`, `clickRow`, `pressKeyOnRow`, `isRowFocusable`,
  `isLoading`, `isRowActive`, `getActiveRowIndex`, `toggleRowExpansion`, `isRowExpanded`,
  `getDetailRowContent`. Do not query `tn-table` internals with raw CSS — `.tn-table__*`
  classes are not part of the public contract.

## Recipe 7 — Button toggle group (`ix-button-group` → `tn-button-toggle-group`)

`tn-button-toggle-group` is content-projection-based and has a smaller input surface than
`ix-button-group`. Two things to get right:

```html
<span [id]="controllerToggleLabelId" class="visually-hidden-label">
  {{ 'Controller Type' | translate }}
</span>
<tn-button-toggle-group
  [value]="selectedController()"
  [ariaLabelledby]="controllerToggleLabelId"
  (valueChange)="selectController($event)"
>
  @for (option of controllerOptions; track option.value) {
    <tn-button-toggle
      [value]="option.value"
      [ixTest]="['controller', option.value]"
    >{{ option.label | translate }}</tn-button-toggle>
  }
</tn-button-toggle-group>
```

- **Accessible name.** No `[label]` input. Either `[ariaLabel]="'Controller Type' |
  translate"` (self-contained name), or a visible label `<span>` paired with
  `[ariaLabelledby]` (used when the label is visually present on screen). Don't ship
  without one.
- **Per-instance label IDs.** If you use `[ariaLabelledby]` and the same component can
  instantiate more than once, generate a unique id per instance — otherwise
  `aria-labelledby` resolves to the wrong DOM node. Audit's pattern (a module-scope
  counter incremented in a class field initializer; see `audit.component.ts`) is one
  way; `crypto.randomUUID()` is another.
- **Options are children, not an `[options]` array.** Use `@for` with `<tn-button-toggle>`
  children. The previous `IxButtonGroupComponent` auto-synthesized per-option test IDs
  from `[name]` + `option.value`; with `tn-button-toggle` you set `[ixTest]` on each
  toggle yourself (or pass `testId` as a string input).
- **`tn-button-toggle` is not yet mapped in `test.directive.ts`.** If you add `[ixTest]`
  to a toggle, also add the element-type case to `test.directive.ts` — otherwise the
  directive throws `Unknown element type`.

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

**Element-prefix mutations to watch for.** The `[ixTest]` directive prefixes by element
type, so changing the element type changes the resolved `data-test` value even when the
`[ixTest]` input is identical:

- `<a mat-button [ixTest]="'foo'">` resolved to `link-foo`. `<tn-button [ixTest]="'foo'">`
  resolves to `button-foo`. This is an intentional element-type change (anchor → button)
  but it is RE-visible. If the legacy `link-*` selector is referenced anywhere, either
  pass `testId="link-foo"` literally on the `tn-button` or coordinate the rename.
- `<button mat-menu-item [ixTest]="'foo'">` resolved to `button-foo`. `<tn-menu-item
  [ixTest]="'foo'">` currently resolves to `menu-item-foo` because `test.directive.ts`
  maps `tn-menu-item → "menu-item"`. **This is a regression we recommend fixing in
  `test.directive.ts`** by mapping `tn-menu-item → "button"` (aligns with the
  `tn-button → "button"` precedent and preserves every menu-item ID across the Epic).
  Until that fix lands, pass `testId="button-foo"` as a string input on each
  `tn-menu-item` to preserve the legacy value.

When the prefix would change against your will, prefer fixing the mapping in
`test.directive.ts` over a per-call workaround — one mapping change fixes the pattern for
the whole Epic.

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

**Complex editors inside a focus-trapped dialog/panel.** A built-in focus trap
(`tn-side-panel`, `cdkTrapFocus`, or `role="dialog"`) assumes every focusable child
participates in the standard Tab sequence. Editors that capture Tab themselves —
CodeMirror, Monaco, embedded terminals — break that assumption: Tab inside the editor
moves the cursor, and Shift+Tab can escape the trap to background DOM. The audit
migration (NAS-141063) hit this in `advanced-search` and solved it with a hand-rolled
focus-walker: `compareDocumentPosition` to find the next/previous focusable element
relative to the editor's host, filtered through CDK `InteractivityChecker.isFocusable`,
then `.focus()` directly. See
`src/app/modules/forms/search-input/components/advanced-search/advanced-search.component.ts`
(`moveFocusInDirection`) for the canonical implementation. Test the walker behavior with
real DOM focus assertions (`document.activeElement`) as in
`advanced-search/tests/focus-walker.spec.ts`. If your migration hosts a CodeMirror-class
editor inside a panel, reuse that pattern rather than reinventing it.

The harness agent (`tn-migration-harness`) mandates a `jest-axe` assertion in each
migrated component's spec — that catches a meaningful subset of these automatically. Use
it as the safety net, not the ceiling; keyboard and screen-reader smoke on first use of
each new surface is irreplaceable. (Browser-driven smoke is not currently part of the
review toolchain — Playwright MCP coverage was retired after two consecutive runs were
blocked on dev-VM auth without producing useful findings.)

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
