import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatAutocompleteHarness, AutocompleteHarnessFilters } from '@angular/material/autocomplete/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { IxLabelHarness } from 'app/modules/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface IxComboboxHarnessFilters extends AutocompleteHarnessFilters {
  label: string;
  allowCustomValue?: boolean;
}

export class IxComboboxHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-combobox';

  static with(options: IxComboboxHarnessFilters): HarnessPredicate<IxComboboxHarness> {
    return new HarnessPredicate(IxComboboxHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getAutoCompleteHarness = this.locatorFor(MatAutocompleteHarness);
  getMatInputHarness = this.locatorFor(MatInputHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
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

  async writeCustomValue(text: string): Promise<void> {
    const input = await this.getMatInputHarness();
    return input.setValue(text);
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getAutoCompleteHarness()).isDisabled();
  }
}
