import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { IxLabelHarness } from 'app/modules/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface IxInputHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxInputHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-input';

  static with(options: IxInputHarnessFilters): HarnessPredicate<IxInputHarness> {
    return new HarnessPredicate(IxInputHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatInputHarness = this.locatorFor(MatInputHarness);
  getMatAutocompleteHarness = this.locatorFor(MatAutocompleteHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string | string[]> {
    const input = (await this.getMatInputHarness());
    await input.focus();
    return input.getValue();
  }

  async setValue(value: string | number): Promise<void> {
    const harness = (await this.getMatInputHarness());

    // MatInputHarness does not properly work with numeric values
    // (for example for <input type="number">).
    // https://github.com/angular/components/issues/23894
    if (typeof value === 'number') {
      const nativeInput = await harness.host();
      await nativeInput.setInputValue(value as unknown as string);
      await nativeInput.dispatchEvent('input');
      return nativeInput.blur();
    }

    return harness.setValue(value);
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatInputHarness()).isDisabled();
  }
}
