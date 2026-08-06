import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxExplorerHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxExplorerHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-explorer';

  static with(options: IxExplorerHarnessFilters): HarnessPredicate<IxExplorerHarness> {
    return new HarnessPredicate(IxExplorerHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getInput = this.locatorFor('tn-file-picker input');
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
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
