import { computed, type Signal, type WritableSignal } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { type TnTestIdValue } from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';

/**
 * The secondary-action surface a side-panel-hosted form declares for
 * `FormSidePanelContainerComponent` to render in the panel footer. Kept in its own file so a page
 * component can describe its footer without importing the container component itself.
 */

/**
 * What every clickable footer entry declares, whether it renders as a button in the footer
 * ({@link SidePanelFooterAction}) or as an item in the overflow menu
 * ({@link SidePanelFooterMenuItem}). Shared so the two shapes can't drift apart.
 */
interface SidePanelFooterEntry {
  /** Untranslated marker; the container pipes it through `translate`. */
  label: string;
  testId: TnTestIdValue;
  /** Roles required to show the entry (omit / empty = always shown). */
  requiredRoles?: Role[];
  /** Re-evaluated each change detection — read signals inside for reactive disabling. */
  disabled?: () => boolean;
  onClick: () => void;
}

/**
 * A secondary action rendered in the side-panel footer alongside the built-in Save (e.g. a form's
 * "Send Test Alert"). Listed in `HostedSidePanelForm.footerActions`; the container renders one
 * `tn-button` per entry, before Save.
 */
export interface SidePanelFooterAction extends SidePanelFooterEntry {
  /**
   * Accessible name override (untranslated marker; the container pipes it through `translate`).
   * For a disclosure-style action such as the Advanced/Basic toggle, whose visible label alone
   * doesn't say what it does to the content above it — `tn-button` exposes no `aria-expanded`
   * hook, so the state has to ride in the name. Must contain the visible {@link label} (WCAG
   * 2.5.3, Label in Name).
   *
   * Deliberately not on {@link SidePanelFooterEntry}: `tn-menu-item` has no `ariaLabel` input, so
   * a menu item declaring one would be silently ignored.
   */
  ariaLabel?: string;
  /** `tn-button` color; defaults to `'default'` (secondary). */
  color?: 'primary' | 'secondary' | 'warn' | 'default';
}

/** A single action inside a {@link SidePanelFooterMenu}. */
export interface SidePanelFooterMenuItem extends SidePanelFooterEntry {
  icon?: string;
  iconLibrary?: 'material' | 'mdi' | 'custom' | 'lucide';
}

/**
 * A dropdown of secondary actions rendered in the footer before Save. Use instead of a flat
 * {@link SidePanelFooterAction}[] when several actions would crowd the footer — the container
 * renders one `dots-vertical` icon-button trigger opening a `tn-menu` of the {@link items}.
 */
export interface SidePanelFooterMenu {
  /** Trigger button accessible name / tooltip (untranslated marker). */
  label: string;
  testId: TnTestIdValue;
  items: SidePanelFooterMenuItem[];
}

/**
 * Wording for {@link advancedModeFooterAction}, as an inseparable set: the visible label for each
 * mode plus the matching accessible name. Paired so the two can't drift — the accessible name has
 * to contain the visible label (WCAG 2.5.3, Label in Name), which it wouldn't if a form overrode
 * only the labels. Extraction markers, since the container pipes them through `translate`.
 */
export interface AdvancedModeLabels {
  advanced: string;
  basic: string;
  showAdvanced: string;
  showBasic: string;
}

/** Default wording for {@link advancedModeFooterAction}. */
export const advancedModeOptionLabels: AdvancedModeLabels = {
  advanced: T('Advanced Options'),
  basic: T('Basic Options'),
  showAdvanced: T('Show Advanced Options'),
  showBasic: T('Show Basic Options'),
};

/** Wording for forms whose fields read as settings rather than options (SSH, SMB). */
export const advancedModeSettingLabels: AdvancedModeLabels = {
  advanced: T('Advanced Settings'),
  basic: T('Basic Settings'),
  showAdvanced: T('Show Advanced Settings'),
  showBasic: T('Show Basic Settings'),
};

/**
 * The Advanced/Basic footer toggle that every long form otherwise re-implements: a single secondary
 * action whose label flips with `isAdvancedMode`, and whose click flips the signal.
 *
 * Returned as a `computed` rather than built inside a getter, so the container's per-change-detection
 * read of `footerActions` hands back the same array until the mode actually changes. Wire it as:
 *
 * ```ts
 * private readonly advancedToggle = advancedModeFooterAction(this.isAdvancedMode);
 * get footerActions(): SidePanelFooterAction[] { return this.advancedToggle(); }
 * ```
 *
 * The action sits in the panel footer, after — and detached from — the fields it reveals, and
 * `tn-button` has no `aria-expanded` input, so the mode rides in the accessible name instead: the
 * visible label names the mode being switched to, and {@link SidePanelFooterAction.ariaLabel} says
 * that it will be shown.
 *
 * @param options `labels` swaps the wording (see {@link advancedModeSettingLabels}); `testId`
 * overrides the default so a form that already shipped a different `data-test` value keeps it;
 * `onToggle` runs after the flip, for forms that re-validate the fields the toggle reveals.
 */
export function advancedModeFooterAction(
  isAdvancedMode: WritableSignal<boolean>,
  options: {
    labels?: AdvancedModeLabels;
    testId?: TnTestIdValue;
    onToggle?: (isAdvancedMode: boolean) => void;
  } = {},
): Signal<SidePanelFooterAction[]> {
  const labels = options.labels ?? advancedModeOptionLabels;

  return computed(() => [{
    label: isAdvancedMode() ? labels.basic : labels.advanced,
    ariaLabel: isAdvancedMode() ? labels.showBasic : labels.showAdvanced,
    testId: options.testId ?? 'toggle-advanced-options',
    onClick: () => {
      isAdvancedMode.update((isAdvanced) => !isAdvanced);
      options.onToggle?.(isAdvancedMode());
    },
  }]);
}
