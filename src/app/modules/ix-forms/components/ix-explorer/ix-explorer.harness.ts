import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from '../../utils/harness.utils';

export interface IxExplorerHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxExplorerHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-explorer';

  static with(options: IxExplorerHarnessFilters): HarnessPredicate<IxExplorerHarness> {
    return new HarnessPredicate(IxExplorerHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatInputHarness = this.locatorFor(MatInputHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getValue(): Promise<string> {
    return (await this.getMatInputHarness()).getValue();
  }

  async setValue(value: string): Promise<void> {
    return (await this.getMatInputHarness()).setValue(value);
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatInputHarness()).isDisabled();
  }
}
