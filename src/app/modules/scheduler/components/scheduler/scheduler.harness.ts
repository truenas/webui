import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatSelectHarness, SelectHarnessFilters } from '@angular/material/select/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface IxSchedulerFilters extends SelectHarnessFilters {
  label?: string;
}

export class IxSchedulerHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-scheduler';

  static with(options: IxSchedulerFilters): HarnessPredicate<IxSchedulerHarness> {
    return new HarnessPredicate(IxSchedulerHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getSelectHarness = this.locatorFor(MatSelectHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getValue(): Promise<string> {
    return (await this.getSelectHarness()).getValueText();
  }

  async setValue(newLabel: string): Promise<void> {
    const select = (await this.getSelectHarness());
    await select.open();

    await select.clickOptions({ text: newLabel });
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getSelectHarness()).isDisabled();
  }
}
