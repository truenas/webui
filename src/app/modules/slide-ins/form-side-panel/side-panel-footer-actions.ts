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
   * Accessible name override (untranslated; the container translates it), for a disclosure action
   * whose label doesn't say what it does, since `tn-button` has no `aria-expanded`. Must contain the
   * visible {@link label} (WCAG 2.5.3). Not on {@link SidePanelFooterEntry}: `tn-menu-item` would ignore it.
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
 * The Advanced/Basic footer toggle: its label flips with `isAdvancedMode` and a click flips the signal.
 * A `computed`, so `footerActions` returns the same array until the mode changes; expose it via
 * `get footerActions() { return this.advancedToggle(); }`. The mode rides in the accessible name, since
 * `tn-button` has no `aria-expanded`. `testId` keeps an already-shipped `data-test`; `onToggle` runs after
 * the flip, for forms that re-validate the revealed fields.
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
