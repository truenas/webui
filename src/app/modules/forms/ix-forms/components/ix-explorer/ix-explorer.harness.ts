import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';
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
    return (await this.getMatInputHarness()).getValue();
  }

  async setValue(value: string | string[]): Promise<void> {
    if (Array.isArray(value)) {
      value = value.join(',');
    }

    const input = await this.getMatInputHarness();
    await input.setValue(value);
    return (await input.host()).dispatchEvent('change');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatInputHarness()).isDisabled();
  }
}
