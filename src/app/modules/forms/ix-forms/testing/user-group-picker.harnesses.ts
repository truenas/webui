/* eslint-disable max-classes-per-file --
   one harness per picker, and the four pickers are a single family. Four files each
   holding a two-line subclass would be harder to find, not easier. */
import {
  DirectoryChipsHarnessBase, DirectoryComboboxHarnessBase,
} from 'app/modules/forms/ix-forms/testing/directory-field.harness-base';

/**
 * Harness for interacting with `ix-user-combobox` in tests.
 *
 * @example
 * ```ts
 * const owner = await loader.getHarness(IxUserComboboxHarness);
 * await owner.focus();
 * expect(await owner.getOptions()).toEqual(['Add New', 'root', 'operator']);
 * await owner.selectOption('operator');
 * ```
 *
 * @example Addressing one field among several
 * ```ts
 * const maproot = await loader.getHarness(
 *   IxUserComboboxHarness.with({ selector: '[formControlName="maproot_user"]' }),
 * );
 * ```
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

/**
 * Harness for interacting with `ix-user-chips` in tests.
 *
 * @example
 * ```ts
 * const users = await loader.getHarness(IxUserChipsHarness);
 * await users.addChip('root');
 * expect(await users.getChips()).toEqual(['root']);
 * ```
 */
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
