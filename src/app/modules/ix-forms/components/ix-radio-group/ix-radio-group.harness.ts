import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from '../../utils/harness.utils';

export interface IxRadioGroupHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxRadioGroupHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-radio-group';

  static with(options: IxRadioGroupHarnessFilters): HarnessPredicate<IxRadioGroupHarness> {
    return new HarnessPredicate(IxRadioGroupHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatRadioGroupHarness = this.locatorFor(MatRadioGroupHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getValue(): Promise<string> {
    return (await this.getMatRadioGroupHarness()).getCheckedValue();
  }

  async setValue(value: string): Promise<void> {
    const harness = (await this.getMatRadioGroupHarness());
    return harness.checkRadioButton({ label: value });
  }
}
