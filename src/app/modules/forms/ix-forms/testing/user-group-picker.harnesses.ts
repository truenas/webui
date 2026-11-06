/* eslint-disable max-classes-per-file --
   one harness per picker, and the four pickers are a single family. Four files each
   holding a two-line subclass would be harder to find, not easier. */
import {
  DirectoryChipsHarnessBase, DirectoryComboboxHarnessBase,
} from 'app/modules/forms/ix-forms/testing/directory-field.harness-base';

/**
 * Harness for `ix-user-combobox`: `focus()`, `getOptions()` (including the "Add New" row) and
 * `selectOption()`. Address one of several with `.with({ selector: '[formControlName="maproot_user"]' })`.
 */
export class IxUserComboboxHarness extends DirectoryComboboxHarnessBase {
  static readonly hostSelector = 'ix-user-combobox';
}

/**
 * Harness for interacting with `ix-group-combobox` in tests. The group-side twin
 * of {@link IxUserComboboxHarness}, with the same API.
 */
export class IxGroupComboboxHarness extends DirectoryComboboxHarnessBase {
  static readonly hostSelector = 'ix-group-combobox';
}

/** Harness for `ix-user-chips`, e.g. `await users.addChip('root')` then `getChips()`. */
export class IxUserChipsHarness extends DirectoryChipsHarnessBase {
  static readonly hostSelector = 'ix-user-chips';
}

/**
 * Harness for interacting with `ix-group-chips` in tests. The group-side twin of
 * {@link IxUserChipsHarness}, with the same API.
 */
export class IxGroupChipsHarness extends DirectoryChipsHarnessBase {
  static readonly hostSelector = 'ix-group-chips';
}
