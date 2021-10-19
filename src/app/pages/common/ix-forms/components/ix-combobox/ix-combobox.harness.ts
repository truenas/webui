import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatAutocompleteHarness, AutocompleteHarnessFilters } from '@angular/material/autocomplete/testing';
import { IxFormControlHarness } from 'app/pages/common/ix-forms/interfaces/ix-form-control-harness.interface';

export interface IxComboboxHarnessFilters extends AutocompleteHarnessFilters {
  label: string;
}

export class IxComboboxHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-combobox';

  static with(options: IxComboboxHarnessFilters): HarnessPredicate<IxComboboxHarness> {
    return new HarnessPredicate(IxComboboxHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getAutoCompleteHarness = this.locatorFor(MatAutocompleteHarness);

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getErrorText(): Promise<string> {
    const label = await this.locatorForOptional('ix-form-errors')();
    return label?.text() || '';
  }

  async getValue(): Promise<string> {
    return (await this.getAutoCompleteHarness()).getValue();
  }

  /**
   *
   * @param optionLabel label of the option that is to be assigned
   */
  async setValue(optionLabel: string): Promise<void> {
    const harness = (await this.getAutoCompleteHarness());
    await harness.focus();
    await harness.selectOption({ text: optionLabel });
  }
}
