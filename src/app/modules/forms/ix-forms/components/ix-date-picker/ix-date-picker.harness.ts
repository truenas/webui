import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatDatepickerInputHarness } from '@angular/material/datepicker/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxDatepickerHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxDatepickerHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-datepicker';

  static with(options: IxDatepickerHarnessFilters): HarnessPredicate<IxDatepickerHarness> {
    return new HarnessPredicate(IxDatepickerHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatDatepickerInputHarness = this.locatorFor(MatDatepickerInputHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string> {
    return (await this.getMatDatepickerInputHarness()).getValue();
  }

  async setValue(value: string): Promise<void> {
    const harness = await this.getMatDatepickerInputHarness();
    return harness.setValue(value);
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatDatepickerInputHarness()).isDisabled();
  }
}
