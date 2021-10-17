import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatSelectHarness, SelectHarnessFilters } from '@angular/material/select/testing';
import { IxFormControlHarness } from 'app/pages/common/ix/interfaces/ix-form-control-harness.interface';

export interface IxSelectHarnessFilters extends SelectHarnessFilters {
  label: string;
}

export class IxSelectHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-select';

  static with(options: IxSelectHarnessFilters): HarnessPredicate<IxSelectHarness> {
    return new HarnessPredicate(IxSelectHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getSelectHarness = this.locatorFor(MatSelectHarness);

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getErrorText(): Promise<string> {
    const label = await this.locatorForOptional('ix-form-errors')();
    return label?.text() || '';
  }

  async getValue(): Promise<string> {
    return (await this.getSelectHarness()).getValueText();
  }

  /**
   *
   * @param optionLabel label of the option that is to be assigned
   */
  async setValue(optionLabel: string): Promise<void> {
    const harness = (await this.getSelectHarness());
    await harness.open();
    await harness.clickOptions({ text: optionLabel });
  }
}
