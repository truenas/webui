import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';

/**
 * The explorer has no label of its own — the wrapping `<tn-form-field>` owns it — so locate one
 * with the inherited `selector` filter, e.g. `[formControlName="path"]`.
 */
export type IxExplorerHarnessFilters = BaseHarnessFilters;

export class IxExplorerHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-explorer';

  static with(options: IxExplorerHarnessFilters = {}): HarnessPredicate<IxExplorerHarness> {
    return new HarnessPredicate(IxExplorerHarness, options);
  }

  getInput = this.locatorFor('tn-file-picker input');

  /**
   * Always '': the explorer renders no label of its own, so the enclosing `tn-form-field` is what
   * names it. `TnFormControlHarness` reads the label off that field and only delegates the *value*
   * here, so nothing asks this for a name.
   */
  getLabelText(): Promise<string> {
    return Promise.resolve('');
  }

  async getValue(): Promise<string> {
    const value = await (await this.getInput()).getProperty<string>('value');
    // Multi-select values are displayed as "a, b" — normalize to the legacy
    // comma-separated format specs and callers expect.
    return value.replace(/,\s+/g, ',');
  }

  async setValue(value: string | string[]): Promise<void> {
    if (Array.isArray(value)) {
      value = value.join(',');
    }

    const input = await this.getInput();
    await input.setInputValue(value);
    return input.dispatchEvent('change');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getInput()).getProperty<boolean>('disabled');
  }
}
