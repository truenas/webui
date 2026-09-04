/* eslint-disable max-classes-per-file --
   the single- and list-valued halves of one harness family; splitting them would put
   a base in a `*.harness.ts` file of its own for no reader's benefit. */
import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, ComponentHarnessConstructor } from '@angular/cdk/testing';
import { TnAutocompleteHarness, TnChipInputHarness } from '@truenas/ui-components';

/**
 * Shared by the two single-valued picker harnesses — `ix-user-combobox` and
 * `ix-group-combobox`.
 *
 * Both fields are a thin shell over `tn-autocomplete`, so this forwards to the
 * inner harness rather than re-implementing it; `autocomplete()` returns that
 * harness for anything not shortcut here.
 */
export class DirectoryComboboxHarnessBase extends ComponentHarness {
  private inner = this.locatorFor(TnAutocompleteHarness);

  /**
   * Narrows to one field among several, by any base filter — most usefully
   * `selector`, so a form with four of these can address each by the control it
   * is bound to rather than by DOM order.
   *
   * @example
   * ```ts
   * loader.getHarness(
   *   IxUserComboboxHarness.with({ selector: '[formControlName="maproot_user"]' }),
   * );
   * ```
   */
  static with<T extends ComponentHarness>(
    this: ComponentHarnessConstructor<T>,
    options: BaseHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  /** The underlying `tn-autocomplete` harness, for anything not shortcut here. */
  async autocomplete(): Promise<TnAutocompleteHarness> {
    return this.inner();
  }

  /** Focuses the field, which opens the dropdown and loads the first page. */
  async focus(): Promise<void> {
    return (await this.inner()).focus();
  }

  /** Blurs the field, committing a typed value when custom values are allowed. */
  async blur(): Promise<void> {
    return (await this.inner()).blur();
  }

  /** Types into the field, which triggers a directory search. */
  async setInputValue(value: string): Promise<void> {
    return (await this.inner()).setInputValue(value);
  }

  /** The text currently in the field. */
  async getInputValue(): Promise<string> {
    return (await this.inner()).getInputValue();
  }

  /** Labels of the rows on offer, including any create row. */
  async getOptions(): Promise<string[]> {
    return (await this.inner()).getOptions();
  }

  /** Picks a row by its label. */
  async selectOption(filter: string | RegExp): Promise<void> {
    return (await this.inner()).selectOption(filter);
  }

  /** Whether a directory lookup is in flight. */
  async isLoading(): Promise<boolean> {
    return (await this.inner()).isLoading();
  }

  /** Whether the field is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.inner()).isDisabled();
  }
}

/** Shared by the two list-valued picker harnesses. See the note above. */
export class DirectoryChipsHarnessBase extends ComponentHarness {
  private inner = this.locatorFor(TnChipInputHarness);

  /** Narrows to one field among several — see {@link DirectoryComboboxHarnessBase.with}. */
  static with<T extends ComponentHarness>(
    this: ComponentHarnessConstructor<T>,
    options: BaseHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  /** The underlying `tn-chip-input` harness, for anything not shortcut here. */
  async chipInput(): Promise<TnChipInputHarness> {
    return this.inner();
  }

  /** The committed chips, in order. */
  async getChips(): Promise<string[]> {
    return (await this.inner()).getChips();
  }

  /** Types a value and commits it as a chip. */
  async addChip(value: string): Promise<void> {
    return (await this.inner()).addChip(value);
  }

  /** Removes the chip with this text. */
  async removeChip(value: string): Promise<void> {
    return (await this.inner()).removeChip(value);
  }

  /** Types into the field without committing, which triggers a search. */
  async typeText(value: string): Promise<void> {
    return (await this.inner()).typeText(value);
  }

  /** Types `value`, then commits the matching suggestion from the dropdown. */
  async selectSuggestion(value: string): Promise<void> {
    return (await this.inner()).selectSuggestion(value);
  }

  /** Labels of the suggestions currently offered in the dropdown. */
  async getSuggestions(): Promise<string[]> {
    return (await this.inner()).getSuggestions();
  }

  /** Whether a directory lookup is in flight. */
  async isLoading(): Promise<boolean> {
    return (await this.inner()).isLoading();
  }

  /** Whether the field is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.inner()).isDisabled();
  }
}
